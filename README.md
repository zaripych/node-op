# node-op

<a href="https://www.npmjs.com/package/node-op">
<img src="https://img.shields.io/npm/v/node-op.svg" >
</a>
<a href="https://github.com/zaripych/node-op/actions?query=workflow%3A%22Check+Latest+Version%22">
<img src="https://github.com/zaripych/node-op/workflows/Check%20Latest%20Version/badge.svg" >
</a>
<a href="https://github.com/zaripych/node-op/actions?query=workflow%3ARelease">
<img src="https://github.com/zaripych/node-op/workflows/Release/badge.svg" >
</a>
<a href="https://greenkeeper.io/">
<img src="https://badges.greenkeeper.io/zaripych/node-op.svg" >
</a>

Adds `op` - One Password CLI into your `node_modules/.bin`

NOTE: This is not the official 1 Password CLI tool repo, this is just an installer

See https://support.1password.com/command-line/ for more information about `op`

Supported platforms:

- darwin
- linux
- windows

## Installation

As dev dependency:

```
npm install node-op --save-dev
```

or

```
yarn add node-op --dev
```

## Usage

Using `npx`:

```
npx node-op op --help
```

or

```
# Inside bash script:
export PATH=./node_modules/.bin:$PATH
op --help
```

## CLI Installation Process

During `npm install` a script is executed which downloads and unpacks `op` into your `node_modules/node-op/lib` folder.

The `op` executable becomes available to be used through `npm run` or `yarn run`.

## Docker Alternative

There is an official image on Docker Hub

```
https://hub.docker.com/r/1password/op
```

The limitation is that OP sessions generated by the image containers cannot be shared. Once container that generated the image is stopped/destroyed the session is not valid any more, so multiple `op` operations might require multiple sign-ins.

## On security

NOTE: This is not official way of `op` CLI tool installation, no guarantees.

Other than making a basic precaution of verifying the server certificate fingerprint (certificate pinning) there are no signature checks.

After the CLI is installed it is your responsobility what happens with it.

Read `op` documentation. Make sure to logout after using the CLI and make sure the login credentials are not exposed outside your scripts. This can be achieved by wrapping your scripts into a bash shell script that retains environment variables inside, rather than exporting it outside.

Make sure to only use trusted code within your bash shell script that does not depend on outside `node_modules` which could take advantage of having access to environment variables with credentials.

## Auto-updates

A travis job checks for updates on official web sites and creates a PR to the GitHub repo, so new versions should be available to users in a reasonable time.
