export type BivariantFn<Args extends unknown[], Return> = {
  bivarianceHack(...args: Args): Return;
}['bivarianceHack'];
