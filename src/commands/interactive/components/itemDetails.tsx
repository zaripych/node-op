import chalk from 'chalk';
import { Box, Text } from 'ink';
import React from 'react';
import { EMPTY, merge, of } from 'rxjs';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { formatWithOptions } from 'util';

import { copyToClipboard, keyInput } from '../actions';
import {
  isTruthy,
  ofType,
  sharedState,
  useEpic,
  useSelect,
} from '../building-blocks';
import type { UiItemDetailsField } from '../state';
import { appState } from '../state';
import { itemDetailsOtpStatus } from '../state/itemDetails';
import { ErrorAlert } from './errorAlert';
import { FieldCursor, FieldStatus, ItemField, ItemOtpField } from './itemField';
import { Keystroke } from './keystroke';
import { VerticalScrollView } from './scrollView';

const setCurrentField = (field: UiItemDetailsField) => {
  return {
    type: setCurrentField,
    field,
  };
};

const currentField = sharedState(
  (actions) =>
    actions.pipe(
      ofType(setCurrentField),
      map((action) => action.field)
    ),
  {
    initial: undefined,
  }
);

function useCopyToClipboardOnEnter(props: { allFields: UiItemDetailsField[] }) {
  const { allFields } = props;

  useEpic(
    (actions) =>
      merge(
        // select first field on mount
        allFields[0] ? of(setCurrentField(allFields[0])) : EMPTY,

        // react to keyboard input
        actions.pipe(
          ofType(keyInput),
          withLatestFrom(currentField),
          switchMap(([action, field]) => {
            if (!field) {
              return EMPTY;
            }

            const clamped = (value: number) =>
              Math.max(0, Math.min(value, allFields.length - 1));

            const index = allFields.indexOf(field);

            if (action.key.return && !process.stdout.isTTY) {
              process.stdout.write(field.value);
              process.exit(0);
            }

            if (
              (action.key.ctrl && action.input === 'x') ||
              (action.key.return && process.stdout.isTTY)
            ) {
              return of(copyToClipboard(field));
            }

            if (action.key.downArrow) {
              const next = allFields[clamped(index + 1)];
              if (!next) {
                return EMPTY;
              }

              return of(setCurrentField(next));
            }

            if (action.key.upArrow) {
              const next = allFields[clamped(index - 1)];
              if (!next) {
                return EMPTY;
              }

              return of(setCurrentField(next));
            }

            return EMPTY;
          })
        )
      ),
    [allFields]
  );
}

function useItemDetailsState() {
  if (!appState.itemDetails.value) {
    throw new Error(
      'This component should only be rendered when item details are available'
    );
  }

  const [itemDetails] = useSelect(
    () => appState.itemDetails.pipe(filter(isTruthy)),
    [],
    appState.itemDetails.value
  );

  const allSections = React.useMemo(
    () => [{ title: '', fields: itemDetails.fields }, ...itemDetails.sections],
    [itemDetails.sections]
  );

  const allFields = React.useMemo(
    () =>
      allSections.reduce<UiItemDetailsField[]>(
        (acc, section) => [...acc, ...section.fields],
        []
      ),
    [allSections]
  );

  const [copyRequest] = useSelect(appState.copyToClipboardRequest);

  return {
    title: itemDetails.title,
    allFields,
    sections: allSections,
    copyRequest,
    itemDetails,
  };
}

const ItemFieldRow: React.ComponentType<{
  field: UiItemDetailsField;
}> = (props) => {
  const { field } = props;
  const [selected] = useSelect(
    (field) => currentField.pipe(map((current) => current === field)),
    [field]
  );
  const [otpField] = useSelect(
    (field) =>
      itemDetailsOtpStatus.pipe(
        switchMap((data) => {
          const otp = data[field.value];
          if (!otp) {
            return EMPTY;
          }
          return of(otp);
        })
      ),
    [field]
  );
  return (
    <Box flexDirection="row">
      {selected ? <FieldCursor field={field} /> : <Box width={1} />}
      <FieldStatus field={field} marginRight={1} />
      {otpField ? (
        <ItemOtpField title={field.title} otpField={otpField} />
      ) : (
        <ItemField field={field} />
      )}
    </Box>
  );
};

export const ItemDetails: React.ComponentType = () => {
  const { title, allFields, sections, copyRequest, itemDetails } =
    useItemDetailsState();

  useCopyToClipboardOnEnter({ allFields });

  const details = React.useMemo(
    () =>
      formatWithOptions({ depth: 10, colors: chalk.level > 0 }, itemDetails),
    [itemDetails]
  );

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1} height={2} flexShrink={0}>
        <Text color="bold">{title}</Text>
        {!process.stdout.isTTY && (
          <Box>
            <Text>
              Select item and press <Keystroke value="Enter" /> to print to
              stdout and exit. Or <Keystroke value="Ctrl+X" /> to copy to
              clipboard. <Keystroke value="Backspace" /> to go back.
            </Text>
          </Box>
        )}
        {process.stdout.isTTY && (
          <Box>
            <Text>
              Select item and press <Keystroke value="Enter" /> to copy to
              clipboard. <Keystroke value="Backspace" /> to go back.
            </Text>
          </Box>
        )}
      </Box>

      {sections.length > 0 && (
        <VerticalScrollView contentHeightDeps={[sections]}>
          {sections.map((section, si) => (
            <Box flexDirection="column" key={si}>
              {section.title && (
                <Box flexDirection="row" marginTop={1}>
                  <Text>{section.title}</Text>
                </Box>
              )}
              {section.fields.map((field, fi) => (
                <ItemFieldRow field={field} key={fi} />
              ))}
            </Box>
          ))}
        </VerticalScrollView>
      )}
      {allFields.length === 0 && (
        <VerticalScrollView contentHeightDeps={[details]}>
          <Text>Item cannot be displayed, here is raw information:</Text>
          <Text>{details}</Text>
        </VerticalScrollView>
      )}

      {copyRequest.status === 'failed' && (
        <ErrorAlert error={copyRequest.error} />
      )}
    </Box>
  );
};
