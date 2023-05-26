import { URL } from 'url';

import type {
  DetailField,
  DetailSection,
  DetailSectionField,
  Item,
  ItemDetails,
} from '../../../../api';
import { catchSync } from '../../../../api/catchAsync';
import { isTruthy } from '../../building-blocks';
import type {
  ItemType,
  UiItem,
  UiItemDetails,
  UiItemDetailsField,
  UiItemDetailsSection,
} from './items';

const typeByTemplateUuid: Record<string, ItemType> = {
  '001': 'login',
  '002': 'card',
  '003': 'notes',
  '005': 'password',
  '006': 'document',
};

export function mapItems(items: Item[]): UiItem[] {
  const mapped = items.map((item) => {
    const url = catchSync(() => new URL(item.overview.url).host);
    const result: UiItem = {
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

function mapDetailField(field: DetailField): UiItemDetailsField | null {
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

function mapSectionField(field: DetailSectionField): UiItemDetailsField | null {
  if (typeof field.v !== 'string') {
    return null;
  }
  return {
    title: field.t,
    value: field.v,
    concealed: field.k === 'concealed',
  };
}

function mapSection(section: DetailSection): UiItemDetailsSection | null {
  const fields = (section.fields || [])
    .map((field) => mapSectionField(field))
    .filter(isTruthy);
  if (fields.length === 0) {
    return null;
  }
  return {
    title: section.title,
    fields,
  };
}

export function mapItemDetails(item: ItemDetails): UiItemDetails {
  const url = catchSync(() => new URL(item.overview.url).host);
  const allFields =
    item.details.fields
      ?.map((field) => mapDetailField(field))
      .filter(isTruthy) ?? [];
  const allSections =
    item.details.sections
      ?.map((section) => mapSection(section))
      .filter(isTruthy) ?? [];
  const result: UiItemDetails = {
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
        .reduce<UiItemDetailsField[]>(
          (acc, section) => [...acc, ...section.fields],
          []
        ),
      item.details.password && {
        concealed: true,
        title: 'password',
        value: item.details.password,
      },
      item.details.notesPlain && {
        concealed: false,
        title: 'notes',
        value: item.details.notesPlain,
      },
    ].filter(isTruthy),
    sections: allSections.filter((section) => section.title.length > 0),
    original: item,
  };
  return result;
}
