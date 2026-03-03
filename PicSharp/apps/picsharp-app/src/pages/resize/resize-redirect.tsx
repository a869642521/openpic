import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useResizeStore from '@/store/resize';
import { isValidArray } from '@/utils';

export default function ResizeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const { files } = useResizeStore.getState();
    if (isValidArray(files)) {
      navigate('/resize/workspace', { replace: true });
    } else {
      navigate('/resize/guide', { replace: true });
    }
  }, [navigate]);

  return null;
}
