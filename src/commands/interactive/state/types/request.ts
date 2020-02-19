import { IErrorInfo } from './errorInfo';

export interface ISuccessRequest<D> {
  status: 'success';
  data: D;
}

export type IRequest<D> =
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
      error: IErrorInfo;
    };
