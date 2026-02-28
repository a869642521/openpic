import { Navigate } from 'react-router';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';

export default function WatchRedirect() {
  const { watchingFolder } = useCompressionStore(useSelector(['watchingFolder']));
  return (
    <Navigate to={watchingFolder ? '/compression/watch/workspace' : '/compression/watch/guide'} replace />
  );
}
