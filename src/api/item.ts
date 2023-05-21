import type { JsonWebKey } from 'crypto';

export interface Item {
  uuid: string;
  templateUuid: string;
  trashed: 'N' | 'Y';
  createdAt: string;
  updatedAt: string;
  changerUuid: string;
  itemVersion: number;
  vaultUuid: string;
  overview: {
    URLs: string[];
    title: string;
    url: string;
    tags: string[];
    ainfo: string;
  };
}

export interface ItemDetails {
  uuid: string;
  templateUuid: string;
  trashed: 'N' | 'Y';
  createdAt: string;
  updatedAt: string;
  changerUuid: string;
  itemVersion: number;
  vaultUuid: string;
  overview: {
    URLs: string[];
    title: string;
    url: string;
    tags: string[];
    ainfo: string;
  };
  details: {
    fields?: DetailField[];
    documentAttributes?: {
      documentId: string;
      fileName: string;
      integrityHash?: string;
      nonce?: string;
      encryptedSize?: number;
      unencryptedSize?: number;
      signingKey?: JsonWebKey;
      encryptionKey?: JsonWebKey;
    };
    notesPlain?: string;
    password?: string;
    passwordHistory?: string[];
    sections?: DetailSection[];
  };
}

export interface DetailField {
  type: 'E' | 'T' | 'P';
  designation: string;
  value: string;
  name: string;
}

export interface DetailSection {
  name: string;
  title: string;
  fields?: DetailSectionField[];
}

export interface DetailSectionField {
  k: string;
  n: string;
  t: string;
  v: string;
}
