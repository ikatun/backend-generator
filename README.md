backend-generator
=================

Tool to help you setup and maintain your backend code faster

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/backend-generator.svg)](https://npmjs.org/package/backend-generator)
[![Downloads/week](https://img.shields.io/npm/dw/backend-generator.svg)](https://npmjs.org/package/backend-generator)
[![License](https://img.shields.io/npm/l/backend-generator.svg)](https://github.com/ikatun/backend-generator/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g backend-generator
$ backend-generator COMMAND
running command...
$ backend-generator (-v|--version|version)
backend-generator/0.0.1 darwin-x64 node-v12.13.1
$ backend-generator --help [COMMAND]
USAGE
  $ backend-generator COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`backend-generator er [DESTINATION]`](#backend-generator-er-destination)
* [`backend-generator help [COMMAND]`](#backend-generator-help-command)

## `backend-generator er [DESTINATION]`

Generate TypeORM models from model.er file

```
USAGE
  $ backend-generator er [DESTINATION]

EXAMPLE
  $ backend-generator er
  ER model generated.
```

_See code: [src/commands/er.ts](https://github.com/ikatun/backend-generator/blob/v0.0.1/src/commands/er.ts)_

## `backend-generator help [COMMAND]`

display help for backend-generator

```
USAGE
  $ backend-generator help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_
<!-- commandsstop -->
