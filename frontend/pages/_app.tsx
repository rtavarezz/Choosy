import '../styles/globals.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

// Dynamically import Analytics to avoid SSR issues
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })), {
  ssr: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
} 