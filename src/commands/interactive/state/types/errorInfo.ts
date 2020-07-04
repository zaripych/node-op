export interface IErrorInfo {
  message: string;
  details: string;
  error?: unknown;
}

export function errorInfo(error: unknown, errorDetails?: string): IErrorInfo {
  if (typeof error === 'object' && error instanceof Error) {
    const messageSource = error.stack ?? error.message;
    const index = messageSource.indexOf('\n');
    if (index === -1) {
      const message = messageSource;
      const stackDetails =
        error.stack && error.stack.startsWith(messageSource)
          ? error.stack.substring(messageSource.length)
          : error.stack;
      const details = errorDetails ?? stackDetails ?? '';
      return {
        message: message.trim(),
        details: details.trim(),
        error,
      };
    } else {
      const message = messageSource.substr(0, index);
      const stackDetails =
        error.stack && error.stack.startsWith(message)
          ? error.stack.substring(message.length)
          : error.stack;
      const details = errorDetails ?? stackDetails ?? '';
      return {
        message: message.trim(),
        details: details.trim(),
        error,
      };
    }
  } else {
    const messageSource = `${String(error)}`;
    const index = messageSource.indexOf('\n');
    const message = messageSource.substr(0, index);
    const details = errorDetails ?? messageSource.substr(index + 1);
    return {
      message: message.trim(),
      details: details.trim(),
      error,
    };
  }
}
