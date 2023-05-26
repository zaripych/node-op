import { beforeAll, describe, expect, it } from '@jest/globals';
import { stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

import type { Command } from '../api';
import { installOnePassword, listForwardedCommands } from '../api';

const pathExists = (path: string) =>
  stat(path)
    .then(() => true)
    .catch(() => false);

const opDirectory = fileURLToPath(new URL('../../bin', import.meta.url));
const opPath = join(opDirectory, 'op');

describe('after op is installed', () => {
  beforeAll(async () => {
    await installOnePassword(opDirectory);
  });

  describe('listing op commands', () => {
    let commands: Command[] = [];
    beforeAll(async () => {
      commands = await listForwardedCommands(opPath);
    });

    it('should match current constants', async () => {
      expect(commands).toMatchInlineSnapshot(`
        [
          {
            "command": "add",
            "description": "Grant access to groups or vaults",
          },
          {
            "command": "completion",
            "description": "Generate shell completion information",
          },
          {
            "command": "confirm",
            "description": "Confirm a user",
          },
          {
            "command": "create",
            "description": "Create an object",
          },
          {
            "command": "delete",
            "description": "Remove an object",
          },
          {
            "command": "edit",
            "description": "Edit an object",
          },
          {
            "command": "encode",
            "description": "Encode the JSON needed to create an item",
          },
          {
            "command": "forget",
            "description": "Remove a 1Password account from this device",
          },
          {
            "command": "get",
            "description": "Get details about an object",
          },
          {
            "command": "help",
            "description": "Get help for a command",
          },
          {
            "command": "list",
            "description": "List objects and events",
          },
          {
            "command": "reactivate",
            "description": "Reactivate a suspended user",
          },
          {
            "command": "remove",
            "description": "Revoke access to groups or vaults",
          },
          {
            "command": "signin",
            "description": "Sign in to a 1Password account",
          },
          {
            "command": "signout",
            "description": "Sign out of a 1Password account",
          },
          {
            "command": "suspend",
            "description": "Suspend a user",
          },
          {
            "command": "update",
            "description": "Check for and download updates",
          },
        ]
      `);

      for (const cmd of commands.filter(
        (item) => !['help'].includes(item.command)
      )) {
        const exists = await pathExists(
          fileURLToPath(
            new URL(`../forwards/${cmd.command}.ts`, import.meta.url)
          )
        );
        expect(
          `pathExists('../forwards/${cmd.command}.ts) = ${String(exists)}`
        ).toBe(`pathExists('../forwards/${cmd.command}.ts) = true`);
      }
    });
  });
});
