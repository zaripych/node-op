export function ensureError(err?: unknown): Error {
  if (!err) {
    return new Error(`Invalid error '${String(err)}' thrown`, { cause: err });
  }

  return typeof err === 'object' && err instanceof Error
    ? err
    : new Error(`Invalid error '${String(err)}' thrown`, { cause: err });
}
