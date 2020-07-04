export type ItemType =
  | 'login'
  | 'notes'
  | 'password'
  | 'document'
  | 'card'
  | 'other';

export interface IUiItem {
  type: ItemType;
  uuid: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  urlHost?: string;
  description?: string;
}

export interface IUiItemDetails {
  type: ItemType;
  uuid: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  urlHost?: string;
  description?: string;
  fields: IUiItemDetailsFields[];
  sections: IUiItemDetailsSection[];
  notes?: string;
  original: unknown;
}

export interface IUiItemDetailsFields {
  concealed: boolean;
  title: string;
  value: string;
}

export interface IUiItemDetailsSection {
  title: string;
  fields: IUiItemDetailsFields[];
}
