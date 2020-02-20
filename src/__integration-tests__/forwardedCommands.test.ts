import { installOnePassword, listForwardedCommands, ICommand } from '../api';
import { pathExists } from 'fs-extra';

describe('after op is installed', () => {
  beforeAll(async () => {
    await installOnePassword();
  });

  describe('listing op commands', () => {
    let commands: ICommand[] = [];
    beforeAll(async () => {
      commands = await listForwardedCommands();
    });

    it('should match current constants', async () => {
      expect(commands).toMatchInlineSnapshot(`
        Array [
          Object {
            "command": "add",
            "description": "Grant a user access to a vault or group.",
          },
          Object {
            "command": "confirm",
            "description": "Confirm a user.",
          },
          Object {
            "command": "create",
            "description": "Create an object.",
          },
          Object {
            "command": "delete",
            "description": "Remove an object.",
          },
          Object {
            "command": "edit",
            "description": "Edit an object.",
          },
          Object {
            "command": "encode",
            "description": "Encode the JSON needed to create an item.",
          },
          Object {
            "command": "forget",
            "description": "Remove a 1Password account.",
          },
          Object {
            "command": "get",
            "description": "Get details about an object.",
          },
          Object {
            "command": "list",
            "description": "List objects and events.",
          },
          Object {
            "command": "reactivate",
            "description": "Reactivate a suspended user.",
          },
          Object {
            "command": "remove",
            "description": "Revoke a user's access to a vault or group.",
          },
          Object {
            "command": "signin",
            "description": "Sign in to your 1Password account.",
          },
          Object {
            "command": "signout",
            "description": "Sign out of your 1Password account.",
          },
          Object {
            "command": "suspend",
            "description": "Suspend a user.",
          },
          Object {
            "command": "update",
            "description": "Check for updates.",
          },
        ]
`);
      for (const cmd of commands) {
        expect(await pathExists(`../forwards/${cmd.command}.ts`));
      }
    });
  });
});
