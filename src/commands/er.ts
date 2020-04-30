import { Command, flags } from '@oclif/command';
import path from 'path';

import { generateErModels } from '../services/generate-er-models';

export default class Er extends Command {
  static description = 'Generate TypeORM models from model.er file';

  static examples = [
    `$ backend-generator er
ER model generated.
`,
  ];

  static flags = {
    lazy: flags.boolean(),
  };

  static args = [{ name: 'destination' }];

  async run() {
    const { args, flags } = this.parse(Er);
    const { destination } = args;
    const { lazy } = flags;

    const destinationAbsolute = path.join(process.cwd(), destination);
    await generateErModels(destinationAbsolute, 'model.er', lazy);
  }
}
