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
  void event;
  void payload;
};
