import { Box, Text } from 'ink';
import React from 'react';
import { empty, of } from 'rxjs';
import { filter, switchMap, withLatestFrom } from 'rxjs/operators';

import { copyToClipboard, keyInput } from '../actions';
import {
  isTruthy,
  ofType,
  useEpicWhenMounted,
  useSelect,
  useStateWithActions,
} from '../building-blocks';
import type { IUiItemDetailsFields } from '../state';
import { appState } from '../state';
import { ErrorAlert } from './errorAlert';
import { FieldStatus, ItemField } from './itemField';
import { Keystroke } from './keystroke';
import { VerticalLimitView } from './limitView';

interface IProps {
  viewportHeight: number;
  viewportWidth: number;
}

function useCopyToClipboardOnEnter(props: { fields: IUiItemDetailsFields[] }) {
  const { fields } = props;
  const [cursor, setCursor, cursors] = useStateWithActions(0);

  useEpicWhenMounted(
    (actions) =>
      actions.pipe(
        ofType(keyInput),
        withLatestFrom(cursors),
        switchMap(([action, currentCursor]) => {
          if (currentCursor < 0 || currentCursor >= fields.length) {
            return empty();
          }

          const field = fields[currentCursor];
          if (!field) {
            throw new Error('Expected field to be initialized');
          }

          if (action.key.return && !process.stdout.isTTY) {
            process.stdout.write(field.value);
            process.exit(0);
          } else if (
            (action.key.ctrl && action.input === '^x') ||
            (action.key.return && process.stdout.isTTY)
          ) {
            return of(copyToClipboard(field));
          } else {
            return empty();
          }
        })
      ),
    [cursors, fields]
  );

  return [cursor, setCursor] as const;
}

function useItemDetailsState() {
  if (!appState.itemDetails.value) {
    throw new Error(
      'This component should only be rendered when item details are available'
    );
  }

  const [itemDetails] = useSelect(appState.itemDetails.pipe(filter(isTruthy)), {
    deps: [appState.itemDetails],
    initial: appState.itemDetails.value,
  });

  const realFields = React.useMemo(
    () => [
      ...itemDetails.fields,
      ...itemDetails.sections.reduce<IUiItemDetailsFields[]>(
        (acc, section) => [...acc, ...section.fields],
        []
      ),
    ],
    [itemDetails]
  );

  const fields = React.useMemo(
    () => [
      ...[
        itemDetails.notes && {
          concealed: false,
          title: 'notes',
          value: itemDetails.notes,
        },
      ].filter(isTruthy),
      ...realFields,
    ],
    [itemDetails.notes, realFields]
  );

  const maxFieldNameLength = fields.reduce(
    (max, field) => Math.max(max, field.title.length),
    0
  );

  const [copyRequest] = useSelect(appState.copyToClipboardRequest);

  return {
    title: itemDetails.title,
    fields,
    maxFieldNameLength,
    copyRequest,
  };
}

export const ItemDetails: React.FC<IProps> = (props) => {
  const { title, fields, maxFieldNameLength, copyRequest } =
    useItemDetailsState();
  const [cursor, setCursor] = useCopyToClipboardOnEnter({ fields });

  const components = [
    ...fields.map((field, i) => (
      <React.Fragment key={i}>
        <Box flexDirection="row">
          <FieldStatus field={field} marginRight={1} />
          <ItemField
            field={field}
            titleColumnWidth={maxFieldNameLength}
            valueColumnWidth={props.viewportWidth - maxFieldNameLength - 7}
          />
        </Box>
      </React.Fragment>
    )),
  ].filter(isTruthy);

  const renderItems = React.useCallback(
    (start: number, end: number) => (
      <React.Fragment>{components.slice(start, end)}</React.Fragment>
    ),
    [components]
  );

  const headerHeight = 2;
  const footerHeight = copyRequest.status === 'failed' ? 2 : 0;
  const viewportHeight = props.viewportHeight - headerHeight - footerHeight;

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
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

      <VerticalLimitView
        itemHeight={1}
        showCursor={true}
        cursor={cursor}
        setCursor={setCursor}
        viewportHeight={viewportHeight}
        itemCount={components.length}
        render={renderItems}
      />
      {copyRequest.status === 'failed' && (
        <ErrorAlert error={copyRequest.error} />
      )}
    </Box>
  );
};

// const content = (
//   <Box flexDirection="column" padding={1}>
//     <Box
//       flexDirection="column"
//       flexShrink={0}
//       textWrap="wrap"
//       ref={refForMeasuring('header')}
//     >
//       <Box textWrap="wrap">
//         <Color bold>{itemDetails.title}</Color>
//       </Box>
//       {usefulDescription && <Box textWrap="wrap">{usefulDescription}</Box>}
//       {itemDetails.notes && <Box textWrap="wrap">{itemDetails.notes}</Box>}
//     </Box>
//     {itemDetails.fields.length > 0 && (
//       <Box flexDirection="column" marginLeft={1} marginTop={1} flexShrink={0}>
//         {itemDetails.fields.map((field, i) => (
//           <React.Fragment key={i}>
//             <ItemField
//               title={field.title}
//               titleColumnWidth={maxFieldNameLength}
//               concealed={field.concealed}
//               value={field.value}
//             />
//           </React.Fragment>
//         ))}
//       </Box>
//     )}
//     {itemDetails.sections.map((section, i) => (
//       <Box
//         flexDirection="column"
//         marginLeft={1}
//         marginTop={1}
//         key={i}
//         flexShrink={0}
//       >
//         <Box marginBottom={1}>
//           <Color>{section.title}</Color>
//         </Box>
//         {section.fields.map((field, k) => (
//           <React.Fragment key={k * i}>
//             <Box marginLeft={2}>
//               <ItemField
//                 title={field.title}
//                 titleColumnWidth={maxFieldNameLength}
//                 concealed={field.concealed}
//                 value={field.value}
//               />
//             </Box>
//           </React.Fragment>
//         ))}
//       </Box>
//     ))}
//   </Box>
// );
