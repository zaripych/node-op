# node-op

<a href="https://www.npmjs.com/package/node-op">
<img src="https://img.shields.io/npm/v/node-op.svg" >
</a>
<a href="https://github.com/zaripych/node-op/actions?query=workflow%3A%22Verify+Downloads%22">
<img src="https://github.com/zaripych/node-op/workflows/Verify%20Downloads/badge.svg" >
</a>
<a href="https://github.com/zaripych/node-op/actions?query=workflow%3A%22Check+Latest+Version%22">
<img src="https://github.com/zaripych/node-op/workflows/Check%20Latest%20Version/badge.svg?branch=master" >
</a>
<a href="https://github.com/zaripych/node-op/actions?query=workflow%3ARelease">
<img src="https://github.com/zaripych/node-op/workflows/Release/badge.svg?branch=master" >
</a>
<a href="https://greenkeeper.io/">
<img src="https://badges.greenkeeper.io/zaripych/node-op.svg" >
</a>

Adds `op` - One Password CLI into your `node_modules/.bin` with additional helper commands and interactive CLI to copy paste passwords into clipboard

NOTE: This is not the official 1-Password CLI tool repo, this is a wrapper

See https://support.1password.com/command-line/ for more information about `op`

Supported platforms:

- darwin
- linux
- windows

![](demo.gif)

## Additional Commands

The library provides additional commands on top of `op` CLI tool which you can find very useful:

### vault-checkout

```
$> npx -p node-op vault-checkout --help
Usage: vault-checkout [options]

Download one or more files from 1-Password vault to current directory

Options:
  -v --vault <vault-name>  vault to use
  --force                  overwrite existing files (default: false)
  -f --files <title>       list of files to checkout
  --verbosity <0|1|2>      verbosity of stdout
  -h, --help               output usage information
```

Example:

```
npx -p node-op op signin ...
npx -p node-op vault-checkout -f secretFile.yaml -f serviceAccount.json -v my-vault
```

The above command will download `secretFile.yaml` and `serviceAccount.json` files from `my-vault` to the current directory.

The CLI will exit with error if:

- we are not already authorized to 1-Password using `op signin`
- files already exist
- there are no documents in the vault with title `secretFile.yaml` or `serviceAccount.json`

Files are checked out independently and in event of issues specific to a single file only where the rest of files can be downloaded successfully - the tool will print out which of those files failed.

### vault-checkin

```
$> npx -p node-op vault-checkin --help
Usage: vault-checkin [options]

Upload one or more files to 1-Password vault from current directory and trash old files with same name

Options:
  -v --vault <vault-name>  vault to use
  --verbosity <0|1|2>      verbosity of stdout
  -f --files <title>       list of files to checkin
  -h, --help               output usage information
```

For example, we could upload `.prod.env` and `service-account.json` files specific to our environment to a secure vault named `service1`:

```
npx -p node-op vault-checkin -f .prod.env -f service-account.json -v service1
```

The CLI will exit with error if:

- we are not already authorized to 1-Password using `op signin`
- `.prod.env` file doesn't exist
- there are already multiple documents with title `.prod.env` in 1-Password

Otherwise, the command will attempt to upload all files specified, put previous versions of these files to the 1-Password trash (delete them) and then delete local files for security reasons.

For example, we could upload `.prod.env` and `service-account.json` files specific to our environment to a secure vault named `service1`:

```
npx -p node-op vault-checkin -f .prod.env -f service-account.json -v service1
```

### vault-diff

```
$> npx -p node-op vault-diff --help
Usage: vault-diff [options]

Compare one or more local checked-out files with their original 1-Password versions

Options:
  -v --vault <vault-name>  vault to use
  -f --files <title>       list of files to compare
  --verbosity <0|1|2>      verbosity of stdout
  -h, --help               output usage information
```

The command uses `git diff` to compare local changes to the versions in the 1-Password vault allowing you to verify/review changes before checkin.

## Installation

To pin particular version of op:

```
npm install node-op
```

or globally:

```
npm install -g node-op
```

after which 1-Password CLI tool should be available globally:

```
$> which op
/home/%USER%/.nvm/versions/node/v10.17.0/bin/op
```

## CLI Installation Process

During `npm install` a script is executed which downloads and unpacks [pinned](https://github.com/zaripych/node-op/blob/master/package.json#L119) version of `op` into your `node_modules/node-op/bin` folder.

The `op` executable becomes available to be used through `npm run` or `yarn run`.

## Auto-updates

A GitHub Actions [job](https://github.com/zaripych/node-op/actions?query=workflow%3A%22Check+Latest+Version%22) checks for updates on official web sites and creates a PR to the GitHub repo to update the pinned version number, so new versions should be available to users in a reasonable time.

## Docker Alternative

There is an official image on Docker Hub

```
https://hub.docker.com/r/1password/op
```

The difference from globally installed `op` is that OP sessions generated by the image containers cannot be shared. Once container that generated the image is stopped/destroyed the session is not valid anymore, so multiple `op` operations might require multiple sign-ins. Or you need to write a bash script to copy and run it inside the container. Which is good from security perspective - if container images are always destroyed and purged.

In addition to that there is no `jq` CLI tool embedded which makes the docker image useful as a base image only.

## On security

NOTE: This is not official way of `op` CLI tool installation, no guarantees.

We are making a basic precaution of verifying the server certificate domain (weak certificate pinning). Certificates are not pinned due to the fact that they change very frequently.

After the CLI is installed it is your responsobility what happens with it.

Read `op` documentation. Make sure to logout after using the CLI and make sure the login credentials are not exposed outside your scripts. This can be achieved by wrapping your scripts into a bash shell script that retains environment variables inside, rather than exporting it outside.

Make sure to only use trusted code within your bash shell script that does not depend on outside `node_modules` which could take advantage of having access to environment variables with credentials.
