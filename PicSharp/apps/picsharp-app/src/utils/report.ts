/**
 * 轻量级上报模块，仅依赖 apm，避免 store/app 拉入完整 utils
 */
import { isAptabaseEnabled } from './apm';

export class ReportError extends Error {
  override cause: Error;
  constructor(error: Error) {
    super(`Report Failed: ${error.message}`);
    this.name = 'ReportError';
    this.cause = error;
  }
}

export async function captureError(
  error: Error,
  payload?: Record<string, unknown>,
  tag?: string,
) {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.withScope((scope: { setContext: Function; setTag: Function; captureException: Function }) => {
      if (payload) scope.setContext('Error Payload', payload);
      if (tag) scope.setTag('tag', tag);
      scope.captureException(error);
    });
  } catch (_) {}
}

export const report = (event: string, payload?: Record<string, unknown>) => {
  if (!isAptabaseEnabled) return;
  import('@aptabase/web')
    .then(({ trackEvent }) => trackEvent(event, payload))
    .catch((err) => captureError(err instanceof Error ? err : new Error(String(err))));
};
