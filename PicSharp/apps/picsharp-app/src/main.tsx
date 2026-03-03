import './utils/apm';
import './utils/tray';
import './utils/menu';
import './i18n';
import './store/settings';
import './index.css';
import { AptabaseProvider } from '@aptabase/react';
import { isAptabaseEnabled } from './utils/apm';
import { isDev } from './utils/platform';
import ReactDOM from 'react-dom/client';
import App from './App';

const appKey = isAptabaseEnabled ? __PICSHARP_ABE_KEY__ : 'A-00000000-0000-0000-0000-000000000000';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AptabaseProvider
    appKey={appKey}
    options={{ isDebug: isDev, appVersion: __PICSHARP_VERSION__ }}
  >
    <App />
  </AptabaseProvider>,
);
