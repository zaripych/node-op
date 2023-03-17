import { beforeAll, describe, it } from '@jest/globals';
import { stat } from 'fs/promises';
import { join } from 'path';

import type { ICommand } from '../api';
import { installOnePassword, listForwardedCommands } from '../api';

const pathExists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

describe('after op is installed', () => {
  beforeAll(async () => {
    await installOnePassword();
  });

  describe('listing op commands', () => {
    let commands: ICommand[] = [];
    beforeAll(async () => {
      commands = await listForwardedCommands('./dist/binaries/op');
    });

    it('should match current constants', async () => {
      expect(commands).toMatchInlineSnapshot(`
        Array [
          Object {
            "command": "add",
            "description": "Grant access to groups or vaults",
          },
          Object {
            "command": "completion",
            "description": "Generate shell completion information",
          },
          Object {
            "command": "confirm",
            "description": "Confirm a user",
          },
          Object {
            "command": "create",
            "description": "Create an object",
          },
          Object {
            "command": "delete",
            "description": "Remove an object",
          },
          Object {
            "command": "edit",
            "description": "Edit an object",
          },
          Object {
            "command": "encode",
            "description": "Encode the JSON needed to create an item",
          },
          Object {
            "command": "forget",
            "description": "Remove a 1Password account from this device",
          },
          Object {
            "command": "get",
            "description": "Get details about an object",
          },
          Object {
            "command": "help",
            "description": "Get help for a command",
          },
          Object {
            "command": "list",
            "description": "List objects and events",
          },
          Object {
            "command": "reactivate",
            "description": "Reactivate a suspended user",
          },
          Object {
            "command": "remove",
            "description": "Revoke access to groups or vaults",
          },
          Object {
            "command": "signin",
            "description": "Sign in to a 1Password account",
          },
          Object {
            "command": "signout",
            "description": "Sign out of a 1Password account",
          },
          Object {
            "command": "suspend",
            "description": "Suspend a user",
          },
          Object {
            "command": "update",
            "description": "Check for and download updates",
          },
        ]
      `);

      for (const cmd of commands.filter(
        (item) => !['help'].includes(item.command)
      )) {
        const exists = await pathExists(
          join(__dirname, `../forwards/${cmd.command}.ts`)
        );
        expect(
          `pathExists('../forwards/${cmd.command}.ts) = ${String(exists)}`
        ).toBe(`pathExists('../forwards/${cmd.command}.ts) = true`);
      }
    });
  });
});
