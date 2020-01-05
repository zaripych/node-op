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
