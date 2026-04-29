import Sentry from '@sentry/node';
import { machineId } from 'node-machine-id';

Sentry.init({
  environment: process.env.NODE_ENV || 'production',
  dsn: process.env.VERYPIC_SIDECAR_SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: 0.05,
  profileSessionSampleRate: 0.01,
  profileLifecycle: 'trace',
  sendDefaultPii: true,
});

machineId(true).then((id) => {
  Sentry.setUser({
    id: process.env.VERYPIC_SIDECAR_USER_ID || id,
  });
});
