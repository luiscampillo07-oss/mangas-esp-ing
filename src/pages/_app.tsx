import type { AppProps } from 'next/app';
import { registerProviders } from '@/providers/config';
import '@/styles/globals.css';

// Registrar proveedores al iniciar la aplicación
registerProviders();

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
