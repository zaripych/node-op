import type { ErrorInfo } from './errorInfo';

export interface SuccessRequest<D> {
  status: 'success';
  data: D;
}

export type IRequest<D> = D extends void
  ?
      | {
          status: 'initial';
        }
      | {
          status: 'started';
        }
      | {
          status: 'success';
        }
      | {
          status: 'failed';
          error: ErrorInfo;
        }
  :
      | {
          status: 'initial';
        }
      | {
          status: 'started';
        }
      | {
          status: 'success';
          data: D;
        }
      | {
          status: 'failed';
          error: ErrorInfo;
        };
