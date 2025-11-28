import { ParamsSerializerConfig } from './types';

export function serializeParams(params: Record<string, unknown>, config?: ParamsSerializerConfig): string {
  const searchParams = new URLSearchParams();
  const arrayFormat = config?.arrayFormat || 'brackets';

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      if (arrayFormat === 'comma') {
        searchParams.append(key, value.join(','));
      } else {
        value.forEach((item) => {
          if (arrayFormat === 'brackets') {
            searchParams.append(`${key}[]`, String(item));
          } else if (arrayFormat === 'repeat') {
            searchParams.append(key, String(item));
          }
        });
      }
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}
