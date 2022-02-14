import React from 'react';
import { AppProps } from 'next/app';
import 'tailwindcss/tailwind.css';
import '@styles/global.scss';
import { appWithTranslation } from '@i18n';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return <Component {...pageProps} />;
}

export default appWithTranslation(MyApp);
