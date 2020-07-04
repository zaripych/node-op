import {
  IItem,
  catchSync,
  IItemDetails,
  IDetailField,
  IDetailSectionField,
  IDetailSection,
} from '../../../../api';
import {
  IUiItem,
  IUiItemDetails,
  ItemType,
  IUiItemDetailsFields,
  IUiItemDetailsSection,
} from './items';
import { URL } from 'url';
import { isTruthy } from '../../building-blocks';

const typeByTemplateUuid: Record<string, ItemType> = {
  '001': 'login',
  '002': 'card',
  '003': 'notes',
  '005': 'password',
  '006': 'document',
};

export function mapItems(items: IItem[]): IUiItem[] {
  const mapped = items.map((item) => {
    const url = catchSync(() => new URL(item.overview.url).host);
    const result: IUiItem = {
      uuid: item.uuid,
      type: typeByTemplateUuid[item.templateUuid] ?? 'other',
      title: item.overview.title,
      ...(item.overview.ainfo && {
        description: item.overview.ainfo,
      }),
      ...(url.result && {
        urlHost: url.result,
      }),
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
    };
    return result;
  });
  mapped.sort((a, b) => (a.title === b.title ? 0 : a.title > b.title ? 1 : -1));
  return mapped;
}

function mapDetailField(field: IDetailField): IUiItemDetailsFields | null {
  if (field.designation === 'username') {
    return {
      title: 'username',
      value: field.value,
      concealed: false,
    };
  }
  if (field.designation === 'password') {
    return {
      title: 'password',
      value: field.value,
      concealed: true,
    };
  }
  return null;
}

function mapSectionField(
  field: IDetailSectionField
): IUiItemDetailsFields | null {
  if (typeof field.v !== 'string') {
    return null;
  }
  return {
    title: field.t,
    value: field.v,
    concealed: field.k === 'concealed',
  };
}

function mapSection(section: IDetailSection): IUiItemDetailsSection | null {
  const fields =
    section.fields?.map((field) => mapSectionField(field)).filter(isTruthy) ??
    [];
  if (fields.length === 0) {
    return null;
  }
  return {
    title: section.title,
    fields,
  };
}

export function mapItemDetails(item: IItemDetails): IUiItemDetails {
  const url = catchSync(() => new URL(item.overview.url).host);
  const allFields =
    item.details.fields
      ?.map((field) => mapDetailField(field))
      .filter(isTruthy) ?? [];
  const allSections =
    item.details.sections
      ?.map((section) => mapSection(section))
      .filter(isTruthy) ?? [];
  const result: IUiItemDetails = {
    uuid: item.uuid,
    type: typeByTemplateUuid[item.templateUuid] ?? 'other',
    title: item.overview.title,
    ...(item.overview.ainfo && {
      description: item.overview.ainfo,
    }),
    ...(url.result && {
      urlHost: url.result,
    }),
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
    fields: [
      ...allFields,
      ...allSections
        .filter((section) => section.title.length === 0)
        .reduce((acc, section) => [...acc, ...section.fields], []),
    ],
    sections: allSections.filter((section) => section.title.length > 0),
    notes: item.details.notesPlain,
    original: item,
  };
  return result;
}
