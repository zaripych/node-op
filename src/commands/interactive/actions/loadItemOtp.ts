import { errorInfo } from '../state/types';

export function loadItemOtpReset() {
  return {
    type: loadItemOtpReset,
    status: 'initial' as const,
  };
}

export function loadItemOtp(otp: string) {
  return {
    type: loadItemOtp,
    status: 'started' as const,
    otp,
  };
}

export function loadItemOtpSuccess(
  otp: string,
  token: string,
  expiresInSeconds?: number
) {
  return {
    type: loadItemOtpSuccess,
    status: 'success' as const,
    otp,
    token,
    expiresInSeconds,
  };
}

export function loadItemOtpFailed(otp: string, error: unknown) {
  return {
    type: loadItemOtpFailed,
    status: 'failed' as const,
    error: errorInfo(error),
    otp,
  };
}
