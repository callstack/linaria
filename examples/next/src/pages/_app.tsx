import type { AppProps } from 'next/app'

import { GlobalStyle } from '../styles/global';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={GlobalStyle}>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
