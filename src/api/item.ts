export interface IItem {
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

export interface IItemDetails {
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
    fields?: IDetailField[];
    documentAttributes?: {
      documentId: string;
      fileName: string;
    };
    notesPlain?: string;
    sections?: IDetailSection[];
  };
}

export interface IDetailField {
  type: 'E' | 'T' | 'P';
  designation: string;
  value: string;
  name: string;
}

export interface IDetailSection {
  name: string;
  title: string;
  fields: IDetailSectionField[];
}

export interface IDetailSectionField {
  k: string;
  n: string;
  t: string;
  v: string;
}
