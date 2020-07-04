import { isError, isString } from 'util';

const innerErrorsToMessage = (pad: string, ...errors: Error[]) => {
  return errors.reduce((acc, val) => {
    const valStr =
      // tslint:disable-next-line:strict-string-expressions
      val instanceof AggregateError
        ? val.description.trim()
        : `${String(val)}`.trim();
    return acc + `${pad}${valStr}`.replace('\n', `\n${pad}`) + '\n';
  }, '');
};

export class AggregateError extends Error {
  public readonly description: string;
  public readonly innerErrors: Error[];

  constructor(message: Error | string, ...innerErrors: Error[]) {
    const errors = [message, ...innerErrors].filter(isError);
    const msg = [
      isError(message) ? 'Multiple errors occured' : message,
      `\n${innerErrorsToMessage('    ', ...errors)}`,
    ]
      .filter(isString)
      .join('')
      .trim();

    super(msg);

    this.name = 'AggregateError';
    this.innerErrors = errors;
    this.description = ['AggregateError', msg].filter(Boolean).join(': ');
  }
}
