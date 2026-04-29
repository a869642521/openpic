import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useConvertStore from '@/store/convert';
import { isValidArray } from '@/utils';

export default function ConvertRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const { files } = useConvertStore.getState();
    if (isValidArray(files)) {
      navigate('/convert/workspace', { replace: true });
    } else {
      navigate('/convert/guide', { replace: true });
    }
  }, [navigate]);

  return null;
}
