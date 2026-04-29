import { useRef, createContext, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { PageProgress, PageProgressRef } from '@/components/fullscreen-progress';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';

export const CompressionContext = createContext<{
  progressRef: React.RefObject<PageProgressRef>;
}>({
  progressRef: null,
});

export default function Compression() {
  const progressRef = useRef<PageProgressRef>(null);
  const t = useI18n();
  const location = useLocation();
  const setMode = useCompressionStore((s) => s.setMode);

  useEffect(() => {
    if (location.pathname.includes('/compression/watch')) {
      setMode('watch');
    } else if (location.pathname.includes('/compression/classic')) {
      setMode('classic');
    }
  }, [location.pathname, setMode]);

  return (
    <CompressionContext.Provider value={{ progressRef }}>
      <div className='relative h-full overflow-auto'>
        <PageProgress ref={progressRef} description={t('tips.import_files')} />
        <Outlet />
      </div>
    </CompressionContext.Provider>
  );
}
