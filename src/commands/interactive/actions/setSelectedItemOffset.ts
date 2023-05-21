/**
 * Offset of the item with specified id in the search items view
 */
export function setSelectedItemOffset(opts: { uuid: string; offset: number }) {
  return {
    type: setSelectedItemOffset,
    ...opts,
  };
}
