export function redact<T extends string>(text: T, mangle?: boolean): T;
export function redact<T extends string>(
  text: T | undefined,
  mangle?: boolean
): T | undefined;
export function redact<T extends string>(text: T, mangle = false): T {
  if (!text) {
    return undefined as unknown as T;
  }

  if (text.includes('otpauth:')) {
    return text;
  }

  if (text.toLowerCase().includes('@gmail.com')) {
    return 'dude@cloud.com' as T;
  }

  if (text.toLowerCase().includes('zaripych')) {
    return '🦞lobster🦞' as T;
  }

  let result: string = text;
  [...text.matchAll(/\d+/g)].forEach((match) => {
    result = result.replace(
      match[0],
      new Array(match[0].length)
        .fill(0)
        .map(() => String(Math.ceil(Math.random() * 9)))
        .join('')
    );
  });

  if (mangle) {
    const base = 'abcdefghijklmnopqrstuvwxyz';
    const alphabet = base + base.toUpperCase();

    [...text.matchAll(/\w+/g)].forEach((match) => {
      result = result.replace(
        match[0],
        new Array(match[0].length)
          .fill(0)
          .map(() => alphabet[Math.ceil(Math.random() * alphabet.length - 1)])
          .join('')
      );
    });
  }

  return result as T;
}
