export type Optional<T> =
  | {
      error: Error;
      result: null;
    }
  | {
      error: null;
      result: T;
    };

export interface IRethrowInfo {
  thrown: Error;
  rethrow: () => Error;
  withMessage: (message: string) => Error;
  toString(): string;
}
