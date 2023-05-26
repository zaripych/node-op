export type ItemType =
  | 'login'
  | 'notes'
  | 'password'
  | 'document'
  | 'card'
  | 'other';

export interface UiItem {
  type: ItemType;
  uuid: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  urlHost?: string;
  description?: string;
}

export interface UiItemDetails {
  type: ItemType;
  uuid: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  urlHost?: string;
  description?: string;
  fields: UiItemDetailsField[];
  sections: UiItemDetailsSection[];
  original: unknown;
}

export interface UiItemDetailsField {
  concealed: boolean;
  title: string;
  value: string;
}

export interface UiItemDetailsOtpField {
  otp: string;
  token: string;
  expiresInSeconds: number;
}

export interface UiItemDetailsSection {
  title: string;
  fields: UiItemDetailsField[];
}
