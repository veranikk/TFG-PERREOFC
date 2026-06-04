/**
 * Renders the +html screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// cardAlt light: #F0F0F3  |  cardAlt dark: #2D2D45
// text light:   #000000   |  text dark:   #FDFFFF
const globalStyles = `
/* Reset outline del browser */
input, textarea {
  outline: none !important;
}

/* Autofill Chrome/Safari — light (por defecto) */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill {
  -webkit-box-shadow: 0 0 0px 1000px #F0F0F3 inset !important;
  -webkit-text-fill-color: #000000 !important;
  caret-color: #000000 !important;
  transition: background-color 9999s ease-in-out 0s !important;
}

/* Autofill Chrome/Safari — dark */
[data-theme="dark"] input:-webkit-autofill,
[data-theme="dark"] input:-webkit-autofill:hover,
[data-theme="dark"] input:-webkit-autofill:focus,
[data-theme="dark"] textarea:-webkit-autofill {
  -webkit-box-shadow: 0 0 0px 1000px #2D2D45 inset !important;
  -webkit-text-fill-color: #FDFFFF !important;
  caret-color: #FDFFFF !important;
  transition: background-color 9999s ease-in-out 0s !important;
}
`;
