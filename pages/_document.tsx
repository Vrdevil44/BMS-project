import { Html, Head, Main, NextScript } from 'next/document';

// Runs before first paint so the saved / system theme never flashes.
const THEME_BOOT = `try{var t=localStorage.getItem('bms-theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
