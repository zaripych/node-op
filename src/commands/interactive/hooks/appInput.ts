import React from 'react';
import { StdinContext } from 'ink';
import { IKey, keyInput } from '../actions';
import { useActionBinding } from '../building-blocks';
import { of } from 'rxjs';

export function dispatchAppInput() {
  useAppInput(useActionBinding((input, key) => of(keyInput(input, key))));
}

export function useAppInput(inputHandler?: (input: string, key: IKey) => void) {
  const { stdin, setRawMode, isRawModeSupported } = React.useContext(
    StdinContext
  );

  if (!inputHandler) {
    return { isRawModeSupported };
  }

  React.useEffect(() => {
    if (!isRawModeSupported) {
      return;
    }
    setRawMode?.(true);
    return () => {
      setRawMode?.(false);
    };
  }, [setRawMode, isRawModeSupported]);

  React.useEffect(() => {
    if (!isRawModeSupported) {
      return;
    }

    const handleData = (data: unknown) => {
      let input = String(data);
      const key = {
        // ctrl, shift, none
        upArrow: [
          '\u001b[1;5A',
          '\u001b[1;2A',
          '\u001b[A',
          '\u001bOA',
        ].includes(input),
        downArrow: [
          '\u001b[1;5B',
          '\u001b[1;2B',
          '\u001b[B',
          '\u001bOB',
        ].includes(input),
        leftArrow: [
          '\u001b[1;5D',
          '\u001b[1;2D',
          '\u001b[D',
          '\u001bOD',
        ].includes(input),
        rightArrow: [
          '\u001b[1;5C',
          '\u001b[1;2C',
          '\u001b[C',
          '\u001bOC',
        ].includes(input),
        //
        return: input === '\r',
        escape: input === '\u001B',
        backspace: input === '\b',
        delete: input === '\u007f',
        //
        pageUp: input === '\u001b[5~',
        pageDown: input === '\u001b[6~',
        home: input === '\u001b[H',
        end: input === '\u001b[F',
        //
        ctrl: false,
        shift: false,
        meta: false,
      };

      if (input.includes('\u001b[1;2')) {
        key.shift = true;
      }
      if (input.includes('\u001b[1;5')) {
        key.ctrl = true;
      }

      if (input <= '\u001A' && !key.return && !key.backspace) {
        const next = String.fromCharCode(
          input.charCodeAt(0) + 'a'.charCodeAt(0) - 1
        );
        input = '^' + next;
        key.ctrl = true;
        key.shift = next >= 'A' && next <= 'Z';
        key.meta = true;
      }

      if (input.startsWith('\u001B')) {
        input = input.slice(1);
        key.meta = true;
      }

      const isLatinUppercase = input >= 'A' && input <= 'Z';
      const isCyrillicUppercase = input >= 'А' && input <= 'Я';

      if (input.length === 1 && (isLatinUppercase || isCyrillicUppercase)) {
        key.shift = true;
      }

      inputHandler(input, key);
    };

    stdin.on('data', handleData);
    return () => {
      stdin.off('data', handleData);
    };
  }, [stdin, inputHandler]);

  return { isRawModeSupported };
}
