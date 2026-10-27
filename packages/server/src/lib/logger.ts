import pino from 'pino';

const environment = process.env.NODE_ENV || 'development';
const level = process.env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug');

const logger = pino({
  level: environment === 'test' ? 'silent' : level,
  ...(environment === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});

export default logger;

export const serverLogger = logger.child({ module: 'server' });
export const emailLogger = logger.child({ module: 'email' });
export const smsLogger = logger.child({ module: 'sms' });
export const automationLogger = logger.child({ module: 'automation' });
export const metricsLogger = logger.child({ module: 'metrics' });
