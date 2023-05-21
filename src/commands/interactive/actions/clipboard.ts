import type { UiItemDetailsField } from '../state/types';
import { errorInfo } from '../state/types';

export function copyToClipboard(field: UiItemDetailsField) {
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

export function copyToClipboardSuccess(field: UiItemDetailsField) {
  return {
    type: copyToClipboardSuccess,
    status: 'success' as const,
    field,
  };
}

export function copyToClipboardFailed(
  field: UiItemDetailsField,
  error: unknown
) {
  return {
    type: copyToClipboardFailed,
    status: 'failed' as const,
    error: errorInfo(error),
    field,
  };
}
