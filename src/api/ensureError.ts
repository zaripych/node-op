export function ensureError(err?: unknown): Error {
  // tslint:disable-next-line:strict-boolean-expressions
  if (!err) {
    // tslint:disable-next-line: strict-string-expressions
    return new Error(`Invalid error '${String(err)}' thrown`);
  }

  return typeof err === 'object' && err instanceof Error
    ? err
    : // tslint:disable-next-line: strict-string-expressions
      new Error(`Invalid error '${String(err)}' thrown`);
}
