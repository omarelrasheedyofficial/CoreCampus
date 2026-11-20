import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
    const missing = REQUIRED_ENV.filter((name) => !env[name]);
    if (missing.length) throw new Error(`Missing ${missing.join(', ')} — copy .env.example to .env and fill it in.`);
  }

  return {
    plugins: [react()],
    server: {
      port: 5176,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:5004',
      },
    },
  };
});