import { Navigate } from 'react-router';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { isValidArray } from '@/utils';

export default function ClassicRedirect() {
  const { classicFiles } = useCompressionStore(useSelector(['classicFiles']));
  return (
    <Navigate
      to={isValidArray(classicFiles) ? '/compression/classic/workspace' : '/compression/classic/guide'}
      replace
    />
  );
}
