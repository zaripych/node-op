import type { Stats } from 'fs';

import type { IItem } from '../api';
import { vaultCheckin } from '../commands/vaultCheckin';

type Deps = NonNullable<Parameters<typeof vaultCheckin>[1]>;

describe('vaultCheckin', () => {
  const anyDeps = (): Deps => ({
    listItems: jest.fn(() => Promise.resolve([])),
    createDocument: jest.fn(() => Promise.resolve('new-id')),
    trashItem: jest.fn(() => Promise.resolve()),
    stat: jest.fn(() => Promise.resolve({ isFile: () => true } as Stats)),
    unlink: jest.fn(() => Promise.resolve()),
  });

  describe('given no props', () => {
    const params: Parameters<typeof vaultCheckin> = [
      // @ts-expect-error
      undefined,
      anyDeps(),
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'no properties passed'
      );
    });
  });

  describe('given no files', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: [],
      },
      anyDeps(),
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'files should be a non-empty array of strings'
      );
    });
  });

  describe('given invalid files', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        // @ts-expect-error
        files: 'x',
      },
      anyDeps(),
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'files should be a non-empty array of strings'
      );
    });
  });

  describe('given invalid trash', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        // @ts-expect-error
        files: 'x',
        // @ts-expect-error
        trash: 1,
      },
      anyDeps(),
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'trash should be a boolean'
      );
    });
  });

  describe('given invalid vault', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        // @ts-expect-error
        files: 'x',
        // @ts-expect-error
        vault: 1,
      },
      anyDeps(),
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'vault should be a string'
      );
    });
  });

  describe('given invalid verbosity', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: [],
        verbosity: 10,
      },
      anyDeps(),
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'verbosity should be a number: 0, 1 or 2'
      );
    });
  });

  describe('given single file, that doesnt exist', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
      },
      {
        ...anyDeps(),
        stat: jest.fn(() => Promise.reject(new Error('File doesnt exist'))),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'File doesnt exist'
      );
    });
  });

  describe('given single file, that is not a file', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
      },
      {
        ...anyDeps(),
        stat: jest.fn(() => Promise.resolve({ isFile: () => false } as Stats)),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        `file at path 'file' is not a file`
      );
    });
  });

  describe('given single file, and throwing list function', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() => {
          throw new Error('Simulated error');
        }),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'Cannot list items in 1-Password vault'
      );
    });
  });

  describe('given single file, and failure during creation', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file1'],
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file1',
              },
            } as IItem,
          ])
        ),
        createDocument: jest.fn(() => {
          throw new Error('Cannot create document');
        }),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        'Cannot create new document in 1-Password vault from file "file1"'
      );
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file1');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file1',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).not.toBeCalled();
      expect(params[1]?.unlink).not.toBeCalled();
    });
  });

  describe('given single file, and failure when deleting old document', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file1'],
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file1',
              },
            } as IItem,
          ])
        ),
        trashItem: jest.fn(() => {
          throw new Error('Cannot delete document');
        }),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        `Cannot delete previous version of the document from 1-Password vault, with new document id "new-id" and old document id "uuid1"`
      );
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file1');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file1',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).toBeCalledWith({
        uuid: 'uuid1',
        verbosity: 0,
      });
      expect(params[1]?.unlink).not.toBeCalled();
    });
  });

  describe('given single file, and failure when deleting local file', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file1'],
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid1',
              overview: {
                title: 'file1',
              },
            } as IItem,
          ])
        ),
        unlink: jest.fn(() => {
          throw new Error('Cannot delete document');
        }),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).rejects.toThrowError(
        `Cannot delete local file at "file1" after successfull 1-Password vault upload`
      );
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file1');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file1',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).toBeCalledWith({
        uuid: 'uuid1',
        verbosity: 0,
      });
      expect(params[1]?.unlink).toBeCalledWith('file1');
    });
  });

  describe('given single file, and list function returning matching items', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            } as IItem,
          ])
        ),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).resolves.toBe(undefined);
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).toBeCalledWith({
        uuid: 'uuid',
        verbosity: 0,
      });
      expect(params[1]?.unlink).toBeCalledWith('file');
    });
  });

  describe('given single file, and list function returning matching items, skipping deletion of previous 1-Password item', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
        trash: false,
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            } as IItem,
          ])
        ),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).resolves.toBe(undefined);
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).not.toBeCalled();
      expect(params[1]?.unlink).toBeCalledWith('file');
    });
  });

  describe('given single file, and list function returning matching items, skipping deletion of local file', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
        keepLocal: true,
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            } as IItem,
          ])
        ),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).resolves.toBe(undefined);
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).toBeCalledWith({
        uuid: 'uuid',
        verbosity: 0,
      });
      expect(params[1]?.unlink).not.toBeCalled();
    });
  });

  describe('given single file, and list function returning no matching items', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() => Promise.resolve([])),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).resolves.toBe(undefined);
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
      });
      expect(params[1]?.stat).toBeCalledWith('file');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).toBeCalledTimes(0);
      expect(params[1]?.unlink).toBeCalledWith('file');
    });
  });

  describe('given single file and specific vault', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
        vault: 'vault1',
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            } as IItem,
          ])
        ),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).resolves.toBe(undefined);
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 0,
        vault: 'vault1',
      });
      expect(params[1]?.stat).toBeCalledWith('file');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file',
        vault: 'vault1',
        verbosity: 0,
      });
      expect(params[1]?.trashItem).toBeCalledWith({
        uuid: 'uuid',
        vault: 'vault1',
        verbosity: 0,
      });
      expect(params[1]?.unlink).toBeCalledWith('file');
    });
  });

  describe('given single file and specific vault, with verbosity', () => {
    const params: Parameters<typeof vaultCheckin> = [
      {
        files: ['file'],
        vault: 'vault1',
        verbosity: 2,
      },
      {
        ...anyDeps(),
        listItems: jest.fn(() =>
          Promise.resolve([
            {
              uuid: 'uuid',
              overview: {
                title: 'file',
              },
            } as IItem,
          ])
        ),
      },
    ];

    it('should work', async () => {
      await expect(vaultCheckin(...params)).resolves.toBe(undefined);
      expect(params[1]?.listItems).toBeCalledWith({
        verbosity: 2,
        vault: 'vault1',
      });
      expect(params[1]?.stat).toBeCalledWith('file');
      expect(params[1]?.createDocument).toBeCalledWith({
        file: 'file',
        vault: 'vault1',
        verbosity: 2,
      });
      expect(params[1]?.trashItem).toBeCalledWith({
        uuid: 'uuid',
        vault: 'vault1',
        verbosity: 2,
      });
      expect(params[1]?.unlink).toBeCalledWith('file');
    });
  });
});
