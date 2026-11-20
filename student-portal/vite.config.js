import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

// Student portal: frontend on 5173, its backend on 5001.
// The proxy makes /api same-origin in development, exactly like production where
// Express serves the built app and the API together.
export default defineConfig(({ command, mode }) => {
  // Fail the production build when the public Supabase settings are missing; otherwise the
  // bundle would be built without them and the app could not start.
  if (command === 'build') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
    const missing = REQUIRED_ENV.filter((name) => !env[name]);
    if (missing.length) throw new Error(`Missing ${missing.join(', ')} — copy .env.example to .env and fill it in.`);
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:5001',
      },
    },
  };
});