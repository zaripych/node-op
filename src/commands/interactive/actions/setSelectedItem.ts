import type { UiItem } from '../state/types';

export function setSelectedItem(item?: UiItem) {
  return {
    type: setSelectedItem,
    item,
  };
}

export function setSelectedIndex(index: number) {
  return {
    type: setSelectedIndex,
    index,
  };
}
