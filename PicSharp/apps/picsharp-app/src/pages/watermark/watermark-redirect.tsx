import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useWatermarkStore from '@/store/watermark';
import { isValidArray } from '@/utils';

export default function WatermarkRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const { files } = useWatermarkStore.getState();
    if (isValidArray(files)) {
      navigate('/watermark/workspace', { replace: true });
    } else {
      navigate('/watermark/guide', { replace: true });
    }
  }, [navigate]);

  return null;
}
