import './utils/apm';
import './utils/tray';
import './utils/menu';
import './i18n';
import './store/settings';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
