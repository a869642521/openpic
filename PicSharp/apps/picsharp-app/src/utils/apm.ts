export const isAptabaseEnabled = false;

const sentryDsn =
  typeof __PICSHARP_SENTRY_DSN__ === 'string' && __PICSHARP_SENTRY_DSN__.length > 0
    ? __PICSHARP_SENTRY_DSN__
    : '';

async function initApm() {
  if (sentryDsn) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.init({
        dsn: sentryDsn,
        sendDefaultPii: true,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.01,
        tracePropagationTargets: ['localhost'],
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 0.1,
        beforeSend(event, hint) {
          const error = hint.originalException;
          if (
            error instanceof Error &&
            (error.message.includes('window[') || error.message.includes('validateDOMNesting'))
          ) {
            return null;
          }
          return event;
        },
        enableLogs: true,
      });
    } catch (e) {
      console.warn('[apm] Sentry init failed:', e);
    }
  }
}

initApm();
