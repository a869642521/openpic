import { Navigate } from 'react-router';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';

export default function WatchRedirect() {
  const { watchFolders } = useCompressionStore(useSelector(['watchFolders']));
  return (
    <Navigate to={watchFolders.length > 0 ? '/compression/watch/workspace' : '/compression/watch/guide'} replace />
  );
}
