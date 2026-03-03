import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import AppLayout from './components/layouts/app-layout';
import Compression from './pages/compression';
import Watermark from './pages/watermark';
import WatermarkGuide from './pages/watermark/watermark-guide';
import WatermarkWorkspace from './pages/watermark/watermark-workspace';
import WatermarkRedirect from './pages/watermark/watermark-redirect';
import Resize from './pages/resize';
import ResizeGuide from './pages/resize/resize-guide';
import ResizeWorkspace from './pages/resize/resize-workspace';
import ResizeRedirect from './pages/resize/resize-redirect';
import Convert from './pages/convert';
import ConvertGuide from './pages/convert/convert-guide';
import ConvertWorkspace from './pages/convert/convert-workspace';
import ConvertRedirect from './pages/convert/convert-redirect';
import ClassicCompressionGuide from './pages/compression/classic-guide';
import WatchCompressionGuide from './pages/compression/watch-guide';
import CompressionClassic from './pages/compression/classic';
import CompressionWatch from './pages/compression/watch';
import ClassicRedirect from './pages/compression/classic-redirect';
import WatchRedirect from './pages/compression/watch-redirect';
import Settings from './pages/settings';
import SettingsGeneral from './pages/settings/general';
import SettingsCompression from './pages/settings/compression';
import SettingsTinypng from './pages/settings/tinypng';
import SettingsAbout from './pages/settings/about';
import ImageCompare from './pages/image-compare';
import Update from './pages/update';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme-provider';
import { ThemeProvider } from './components/theme-provider';
import { message, notification } from 'antd';
import { createContext } from 'react';

export const AppContext = createContext<{
  messageApi: ReturnType<typeof message.useMessage>[0];
  notificationApi: ReturnType<typeof notification.useNotification>[0];
}>({
  messageApi: null,
  notificationApi: null,
});

export default function AppRoutes() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  return (
    <ThemeProvider>
      <AppContext.Provider value={{ messageApi, notificationApi }}>
        {messageContextHolder}
        {notificationContextHolder}
        <TooltipProvider delayDuration={100}>
          <Toaster
            position='top-center'
            theme='light'
            offset={{
              top: '48px',
              right: '16px',
              bottom: '48px',
              left: '16px',
            }}
          />
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<AppLayout />}>
                <Route index element={<Navigate to='/compression' />} />
                <Route path='watermark' element={<Watermark />}>
                  <Route index element={<WatermarkRedirect />} />
                  <Route path='guide' element={<WatermarkGuide />} />
                  <Route path='workspace' element={<WatermarkWorkspace />} />
                </Route>
                <Route path='resize' element={<Resize />}>
                  <Route index element={<ResizeRedirect />} />
                  <Route path='guide' element={<ResizeGuide />} />
                  <Route path='workspace' element={<ResizeWorkspace />} />
                </Route>
                <Route path='convert' element={<Convert />}>
                  <Route index element={<ConvertRedirect />} />
                  <Route path='guide' element={<ConvertGuide />} />
                  <Route path='workspace' element={<ConvertWorkspace />} />
                </Route>
                <Route path='compression' element={<Compression />}>
                  <Route index element={<Navigate to='/compression/classic/guide' />} />
                  <Route path='classic'>
                    <Route index element={<ClassicRedirect />} />
                    <Route path='guide' element={<ClassicCompressionGuide />} />
                    <Route path='workspace' element={<CompressionClassic />} />
                  </Route>
                  <Route path='watch'>
                    <Route index element={<WatchRedirect />} />
                    <Route path='guide' element={<WatchCompressionGuide />} />
                    <Route path='workspace' element={<CompressionWatch />} />
                  </Route>
                </Route>
                <Route path='settings' element={<Settings />}>
                  <Route index element={<Navigate to='/settings/general' />} />
                  <Route path='general' element={<SettingsGeneral />} />
                  <Route path='tinypng' element={<SettingsTinypng />} />
                  <Route path='compression' element={<SettingsCompression />} />
                  <Route path='about' element={<SettingsAbout />} />
                </Route>
                <Route path='image-compare' element={<ImageCompare />} />
                <Route path='update' element={<Update />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
