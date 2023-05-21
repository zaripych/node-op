import { errorInfo } from '../state/types';

export function tryLogin(shorthand?: string) {
  return {
    type: tryLogin,
    status: 'started' as const,
    shorthand,
  };
}

export function loginSuccess() {
  return {
    type: loginSuccess,
    status: 'success' as const,
  };
}

export function loginFailed(error: unknown) {
  return {
    type: loginFailed,
    status: 'failed' as const,
    error: errorInfo(error),
  };
}
