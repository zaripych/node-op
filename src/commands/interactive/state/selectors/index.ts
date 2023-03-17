import { copyToClipboardRequest } from './clipboard';
import { filter, filteredItems } from './filter';
import { itemDetails, itemDetailsRequest } from './itemDetails';
import { items, itemsRequest } from './items';
import { offset } from './offset';
import { screen } from './screen';
import { selectedItem } from './selectedItem';
import { vault } from './vault';

export const appState = {
  screen,
  vault,
  items,
  itemsRequest,
  filter,
  filteredItems,
  offset,
  selectedItem,
  itemDetails,
  itemDetailsRequest,
  copyToClipboardRequest,
};
