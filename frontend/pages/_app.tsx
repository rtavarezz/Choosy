import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { DarkModeProvider } from '../lib/darkMode';
import { AuthProvider } from '../lib/auth';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <Component {...pageProps} />
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default MyApp; 