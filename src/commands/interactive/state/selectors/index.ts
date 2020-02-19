import { screen } from './screen';
import { vault } from './vault';
import { items, itemsRequest } from './items';
import { filter, filteredItems } from './filter';
import { offset } from './offset';
import { selectedItem } from './selectedItem';
import { itemDetails, itemDetailsRequest } from './itemDetails';
import { copyToClipboardRequest } from './clipboard';

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
