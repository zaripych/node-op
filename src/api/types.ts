export type OptionalResult<T> =
  | {
      error: Error;
      result: null;
    }
  | {
      error: null;
      result: T;
    };

export interface RethrowInfo {
  cause: Error;
  rethrow: () => Error;
  withMessage: (message: string) => Error;
  toString(): string;
}
