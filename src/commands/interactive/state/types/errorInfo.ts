export interface ErrorInfo {
  message: string;
  details: string;
  error?: unknown;
}

export function errorInfo(error: unknown, errorDetails?: string): ErrorInfo {
  const messageSource = `${String(error)}`;
  const index = messageSource.indexOf('\n');
  const message = messageSource.substring(0, index);
  const stackDetails =
    error instanceof Error ? error.stack : messageSource.substring(index + 1);
  const details = errorDetails ?? stackDetails ?? '';
  return {
    message: message.trim(),
    details: details.trim(),
    error,
  };
}
