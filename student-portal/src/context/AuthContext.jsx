// context/AuthContext.jsx — session state for the whole portal.
// Supabase Auth owns the session (sign in/out, token refresh); our API supplies the
// CampusCore profile and roles for the signed-in account.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient.js';
import { fetchCurrentUser } from '../api/auth.api.js';
import { watchAwayTimeout } from '../utils/awayTimeout.js';

const AWAY_TIMEOUT_MS = 60 * 60 * 1000;
const AuthContext = createContext(null);

// Report incorrect login credentials to CampusCore audit logs (never the password).
// Best effort: a failed or slow report (max 5 s) never replaces the sign-in error message.
async function reportFailedLogin(email) {
  try {
    const response = await fetch('/api/auth/login-failed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.warn('[CampusCore] Failed login audit reporting:', response.status);
  } catch (error) {
    console.warn('[CampusCore] Unable to report failed login:', error.message);
  }
}

export function AuthProvider({ children }) {
  const [authUserId, setAuthUserId] = useState(undefined); // undefined = still checking
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | signedOut | ready | error
  const [error, setError] = useState('');

  // Track the Supabase session. Only the user id matters here, so silent token
  // refreshes don't trigger a reload of the profile.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthUserId(data.session?.user.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load the CampusCore profile whenever a different account signs in.
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
          // Valid Supabase login but not usable in CampusCore (unregistered/deactivated).
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
      try {
        const response = await fetch('/api/auth/login-failed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          console.warn('Failed login audit reporting:', response.status);
        }
      } catch (error) {
        console.warn('Unable to report failed login');
      }

      throw new Error('Incorrect email or password.');
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
