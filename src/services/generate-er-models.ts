import bluebird from 'bluebird';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';

import { fileToGeneratorContext } from './generator/file-to-generator-context';
import { generateEnum } from './generator/generate-enum';
import { generateSingleModel } from './generator/generate-single-model';
import { getEnumName, isEnum } from './generator/model-types';
import { parseErModel } from './generator/parse-er-model';
import { writeToFile } from './generator/write-to-file';

export async function generateErModels(cwd: string, pathToModelFile: string) {
  const modelsData = fs.readFileSync(path.join(cwd, pathToModelFile), { encoding: 'utf8' });
  const models = parseErModel(modelsData);

  for (const model of models) {
    const { name } = model;
    const namePath = _.kebabCase(name);
    const dirNameModels = path.join(cwd, namePath, 'models');
    const dirNameEnums = path.join(cwd, namePath, 'enums');

    const ctx = fileToGeneratorContext(dirNameModels, `${name}.ts`);
    const generatedModel = generateSingleModel(model, ctx);
    await writeToFile(generatedModel, dirNameModels, `${name}.ts`, true);
    await bluebird.each(model.fields.filter(isEnum), async field => {
      const enumName = getEnumName(field);
      await writeToFile(generateEnum(model, field), dirNameEnums, `${enumName}.ts`, true);
    });
  }
}
