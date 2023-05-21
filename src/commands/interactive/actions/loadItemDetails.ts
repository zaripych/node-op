import type { UiItemDetails } from '../state/types';
import { errorInfo } from '../state/types';

export function loadItemDetailsReset() {
  return {
    type: loadItemDetailsReset,
    status: 'initial' as const,
  };
}

export function loadItemDetails(uuid: string) {
  return {
    type: loadItemDetails,
    status: 'started' as const,
    uuid,
  };
}

export function loadItemDetailsSuccess(uuid: string, data: UiItemDetails) {
  return {
    type: loadItemDetailsSuccess,
    status: 'success' as const,
    data,
    uuid,
  };
}

export function loadItemDetailsFailed(uuid: string, error: unknown) {
  return {
    type: loadItemDetailsFailed,
    status: 'failed' as const,
    error: errorInfo(error),
    uuid,
  };
}
