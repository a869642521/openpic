import AppRoutes from './routes';
import { useEffect } from 'react';
import { useReport } from './hooks/useReport';
import { initTray } from './utils/tray';
import { isProd } from './utils/platform';

function App() {
  const r = useReport();
  useEffect(() => {
    r('app_started');
  }, []);
  // 托盘需在 Tauri / WebView 就绪后创建；顶层 import 时调用易静默失败（尤其 Windows 无 image-png 时）
  useEffect(() => {
    if (!isProd) return;
    void initTray().catch((err) => {
      console.error('[initTray]', err);
    });
  }, []);
  return <AppRoutes />;
}

export default App;
