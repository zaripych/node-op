import { describe, expect, it,jest } from '@jest/globals';

import type { Item } from '../api';
import { vaultCheckout } from '../commands/vaultCheckout';

describe('vaultCheckout', () => {
  describe('given no props', () => {
    const params: Parameters<typeof vaultCheckout> = [
      // @ts-expect-error
      undefined,
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'no properties passed'
      );
    });
  });

  describe('given invalid props', () => {
    const params: Parameters<typeof vaultCheckout> = [
      // @ts-expect-error
      'undefined',
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'no properties passed'
      );
    });
  });

  describe('given no files', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        files: [],
      },
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'files should be a non-empty array of strings'
      );
    });
  });

  describe('given invalid force', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        files: ['file'],
        // @ts-expect-error
        force: 1,
      },
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'force should be a boolean'
      );
    });
  });

  describe('given invalid files parameters', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        // @ts-expect-error
        files: 'xxx',
      },
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'files should be a non-empty array of strings'
      );
    });
  });

  describe('given invalid vault parameter', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        // @ts-expect-error
        vault: 1,
        files: ['x'],
      },
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'vault should be a string'
      );
    });
  });

  describe('given single file, but no matching items in the vault', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file'],
      },
      {
        listItems: jest.fn(() => Promise.resolve([])),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        `No document with title 'file' found`
      );
      expect(params[1]?.getDocument).not.toBeCalled();
    });
  });

  describe('given single file, with multiple matching items in the vault', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file'],
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file',
              },
            },
            {
              uuid: 'uuid2',
              overview: {
                title: 'file',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        `More than one document with title 'file' found`
      );
      expect(params[1]?.getDocument).not.toBeCalled();
    });
  });

  describe('given single file, with throwing list fn', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file'],
      },
      {
        listItems: jest.fn(() => {
          throw new Error('Simulated error');
        }),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'Cannot list items in 1-Password vault'
      );
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });
    });
  });

  describe('given single file, with throwing getDocument fn', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file'],
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => {
          throw new Error('Simulated error');
        }),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        'Cannot download document from 1-Password vault'
      );
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });
    });
  });

  describe('given multiple files, with only one non matching item in the vault', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file1', 'file2'],
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file1',
              },
            },
            {
              uuid: 'uuid3',
              overview: {
                title: 'file3',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        `No document with title 'file2' found`
      );
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });
    });
  });

  describe('given multiple files, with more than one non matching item in the vault', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file1', 'file2', 'file4'],
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file1',
              },
            },
            {
              uuid: 'uuid3',
              overview: {
                title: 'file3',
              },
            },
            {
              uuid: 'uuid3',
              overview: {
                title: 'file5',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).rejects.toThrowError(
        `Multiple errors occurred`
      );
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });
    });
  });

  describe('given single file, with matching item in the vault', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file'],
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).resolves.toBeUndefined();
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });
      expect(params[1]?.getDocument).toBeCalledWith({
        vault: 'vault',
        uuid: 'uuid',
        outputFilePath: 'file',
        verbosity: 0,
      });
    });
  });

  describe('given single file, with matching item in the vault and forced checkout', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file'],
        force: true,
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).resolves.toBeUndefined();
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });
      expect(params[1]?.getDocument).toBeCalledWith({
        vault: 'vault',
        uuid: 'uuid',
        outputFilePath: 'file',
        force: true,
        verbosity: 0,
      });
    });
  });

  describe('given multiple files, with single matching items in the vault', () => {
    const params: Parameters<typeof vaultCheckout> = [
      {
        vault: 'vault',
        files: ['file1', 'file2'],
      },
      {
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file1',
              },
            },
            {
              uuid: 'uuid2',
              overview: {
                title: 'file2',
              },
            },
          ] as Item[])
        ),
        getDocument: jest.fn(() => Promise.resolve()),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckout(...params)).resolves.toBeUndefined();
      expect(params[1]?.listItems).toBeCalledWith({
        vault: 'vault',
        verbosity: 0,
      });

      expect(params[1]?.getDocument).toBeCalledWith({
        vault: 'vault',
        uuid: 'uuid1',
        outputFilePath: 'file1',
        verbosity: 0,
      });

      expect(params[1]?.getDocument).toBeCalledWith({
        vault: 'vault',
        uuid: 'uuid2',
        outputFilePath: 'file2',
        verbosity: 0,
      });
    });
  });
});
