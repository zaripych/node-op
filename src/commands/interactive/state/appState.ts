import './login';

import { copyToClipboardRequest } from './clipboard';
import {
  filter,
  filteredItems,
  selectedItem,
  selectedItemIndex,
} from './filter';
import { itemDetails, itemDetailsRequest } from './itemDetails';
import { items, itemsRequest } from './items';
import { loginRequest } from './login';
import { offset } from './offset';
import { screen } from './screen';
import { screenSize } from './screenSize';
import { vault } from './vault';

export const appState = {
  screen,
  screenSize,
  loginRequest,
  vault,
  items,
  itemsRequest,
  filter,
  filteredItems,
  selectedItem,
  selectedItemIndex,
  itemDetails,
  itemDetailsRequest,
  copyToClipboardRequest,
  offset,
};
