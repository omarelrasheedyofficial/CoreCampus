import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient.js';
import { fetchCurrentUser } from '../api/auth.api.js';
import { watchAwayTimeout } from '../utils/awayTimeout.js';

const AWAY_TIMEOUT_MS = 10 * 1000;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUserId, setAuthUserId] = useState(undefined);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthUserId(data.session?.user.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUserId) return;

    return watchAwayTimeout({
      timeoutMs: AWAY_TIMEOUT_MS,
      presenceKey: `campuscore:last-present:${authUserId}`,
      onTimeout: (info) => {
        // Tell the user why they are on the login page; details help diagnose browser quirks.
        console.info('[CampusCore] Signed out after being away from the page.', info);
        setError(`You were signed out after ${AWAY_TIMEOUT_MS / 1000} seconds away from the page.`);
        // ProtectedRoute redirects when Supabase reports the signed-out session.
        supabase.auth.signOut({ scope: 'local' })
          .then(({ error: signOutError }) => {
            if (signOutError) throw signOutError;
          })
          .catch(() => {
            setError('Automatic sign-out failed. Please try signing out again.');
            setStatus('error');
          });
      },
    });
  }, [authUserId]);

  useEffect(() => {
    if (authUserId === undefined) return;
    if (authUserId === null) {
      setUser(null);
      setStatus('signedOut');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    fetchCurrentUser()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setError('');
        setStatus('ready');
      })
      .catch(async (err) => {
        if (cancelled) return;
        if (err.status === 401 || err.status === 403) {
          setError(err.message);
          await supabase.auth.signOut();
          return;
        }
        setError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [authUserId]);

  const signIn = useCallback(async (email, password) => {
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (signInError.code === 'invalid_credentials') {
        throw new Error('Incorrect email or password.');
      }
      if (signInError.code === 'email_not_confirmed') {
        throw new Error('Confirm your email before signing in.');
      }
      if (signInError.status === 429) {
        throw new Error('Too many sign-in attempts. Please wait a few minutes and try again.');
      }
      if (signInError.name === 'AuthRetryableFetchError' || signInError.status === 0) {
        throw new Error('Cannot reach the sign-in service. Please try again.');
      }
      throw new Error('The sign-in service is unavailable. Please try again later.');
    }
  }, []);

  const signOut = useCallback(async () => {
    setError('');
    await supabase.auth.signOut();
  }, []);

  // Reload the account (e.g. after the first-login password change clears mustChangePassword).
  const refreshUser = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const value = { user, status, error, signIn, signOut, refreshUser, hasRole: (role) => !!user?.roles.includes(role) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
