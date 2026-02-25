import { useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import useAppStore from '@/store/app';
import useSelector from '@/hooks/useSelector';
import { isMac } from '@/utils/platform';
import WindowControl from '@/components/window-control';
import useCompressionStore from '@/store/compression';
import { Badge } from '@/components/ui/badge';
import { openPath } from '@tauri-apps/plugin-opener';
import { useTrafficLightStore } from '@/store/trafficLight';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

function Header() {
  const { sidecar } = useAppStore(useSelector(['sidecar']));
  const location = useLocation();
  const { working, watchingFolder } = useCompressionStore(
    useSelector(['working', 'watchingFolder']),
  );
  const { isTrafficLightVisible } = useTrafficLightStore(useSelector(['isTrafficLightVisible']));

  if (getCurrentWebviewWindow().label === 'main') {
    return (
      <header
        className={cn(
          'relative flex h-[48px] w-full flex-shrink-0 items-center',
          isMac && isTrafficLightVisible ? 'px-[73px]' : 'px-2',
        )}
        style={{ backgroundColor: 'rgb(236, 237, 238)' }}
        data-tauri-drag-region
      >
        {working && watchingFolder && (
          <Badge
            variant='midnight'
            className='absolute left-1/2 z-[10] -translate-x-1/2 cursor-pointer text-nowrap transition-all duration-300 hover:underline'
            onClick={() => {
              openPath(watchingFolder);
            }}
          >
            <span className='max-w-[60vw] truncate'>{watchingFolder}</span>
          </Badge>
        )}
        <div className='absolute right-2 flex items-center gap-2'>
          <WindowControl showControls={!isMac} showFullscreen={!isMac} />
        </div>
      </header>
    );
  } else if (
    getCurrentWebviewWindow().label !== 'main' &&
    (location.pathname.startsWith('/compression/watch') ||
      location.pathname.startsWith('/compression/classic'))
  ) {
    return (
      <header
        className={cn(
          'relative flex h-[48px] w-full flex-shrink-0 items-center justify-end',
          isMac && isTrafficLightVisible ? 'px-[73px]' : 'px-2',
        )}
        style={{ backgroundColor: 'rgb(236, 237, 238)' }}
        data-tauri-drag-region
      >
        <WindowControl showControls={!isMac} showFullscreen={!isMac} showAlwaysOnTop={true} />
      </header>
    );
  } else {
    return null;
  }
}

export default Header;
