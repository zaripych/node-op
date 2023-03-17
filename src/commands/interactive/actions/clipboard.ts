import type { IUiItemDetailsFields } from '../state/types';
import { errorInfo } from '../state/types';

export function copyToClipboard(field: IUiItemDetailsFields) {
  return {
    type: copyToClipboard,
    status: 'started' as const,
    field,
  };
}

export function copyToClipboardReset() {
  return {
    type: copyToClipboardReset,
    status: 'initial' as const,
  };
}

export function copyToClipboardSuccess(field: IUiItemDetailsFields) {
  return {
    type: copyToClipboardSuccess,
    status: 'success' as const,
    field,
  };
}

export function copyToClipboardFailed(
  field: IUiItemDetailsFields,
  error: unknown
) {
  return {
    type: copyToClipboardFailed,
    status: 'failed' as const,
    error: errorInfo(error),
    field,
  };
}
