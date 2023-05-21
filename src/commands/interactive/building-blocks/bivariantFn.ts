export type AnyParams = Array<unknown> | ReadonlyArray<unknown>;

export type BivariantFn<Args extends AnyParams, Return> = {
  bivarianceHack(...args: Args): Return;
}['bivarianceHack'];
