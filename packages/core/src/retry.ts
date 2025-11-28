import { RetryConfig } from './types';

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig | false | undefined
): Promise<T> {
  if (!config) {
    return fn();
  }

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      if (attempt > config.attempts) {
        throw error;
      }

      if (config.retryCondition && !config.retryCondition(error as any)) {
        throw error;
      }

      let delay = config.delay;
      if (config.backoff === 'exponential') {
        delay = config.delay * Math.pow(2, attempt - 1);
      } else if (typeof config.backoff === 'function') {
        delay = config.backoff(attempt);
      } else if (config.backoff === 'linear') {
          delay = config.delay * attempt;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
