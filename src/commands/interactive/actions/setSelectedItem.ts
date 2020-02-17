import { IUiItem } from '../state/types';

export function setSelectedItem(item?: IUiItem) {
  return {
    type: setSelectedItem,
    item,
  };
}
