import { report } from '@/utils/report';
import { useCallback } from 'react';

export const useReport = () => {
  return useCallback((event: string, payload?: Record<string, any>) => {
    report(event, payload as Record<string, unknown>);
  }, []);
};
