import appRoot from 'app-root-path';
import bluebird from 'bluebird';
import fs from 'fs';
import _, { lowerFirst } from 'lodash';
import path from 'path';

import { fileToGeneratorContext } from './file-to-generator-context';
import { generateAuthChecker } from './generate-auth-checker';
import { generateCrudResolver } from './generate-crud-resolver';
import { generateEnum } from './generate-enum';
import { generateFieldResolver } from './generate-field-resolver';
import { generateInput } from './generate-input';
import { generateSingleModel } from './generate-single-model';
import { generateUpdateOperations } from './generate-update-operations';
import { getEnumName, isEnum } from './model-types';
import { parseErModel } from './parse-er-model';
import { writeToFile } from './write-to-file';

const modelData = fs.readFileSync(appRoot.resolve('src/model.er'), 'utf8');
const models = parseErModel(modelData);

(async () => {
  for (const model of models) {
    const { name } = model;

    const createInput = generateInput(model, 'create');
    const editInput = generateInput(model, 'edit');
    const nestedInput = generateInput(model, 'nested');
    const searchInput = generateInput(model, 'search');
    const searchOrder = generateInput(model, 'searchOrder');
    const fileContext = fileToGeneratorContext(path.join('src', _.kebabCase(name), 'models'), `${name}.ts`);
    const dbModel = generateSingleModel(model, fileContext);
    const resolver = generateFieldResolver(model);
    const crudResolver = generateCrudResolver(model);
    const authChecker = generateAuthChecker(model);
    const updateOperations = generateUpdateOperations(model);

    const namePath = _.kebabCase(name);

    await writeToFile(createInput, `${namePath}/inputs`, `${name}CreateInput.ts`, true);
    await writeToFile(editInput, `${namePath}/inputs`, `${name}EditInput.ts`, true);
    await writeToFile(nestedInput, `${namePath}/inputs`, `${name}NestedInput.ts`, true);
    await writeToFile(searchInput, `${namePath}/inputs`, `${name}SearchInput.ts`, true);
    await writeToFile(searchOrder, `${namePath}/inputs`, `${name}SearchOrderInput.ts`, true);

    await writeToFile(dbModel, `${namePath}/models`, `${name}.ts`, true);
    await writeToFile(resolver, `${namePath}/resolvers`, `${name}Resolver.ts`, false);
    await writeToFile(crudResolver, `${namePath}/resolvers`, `${name}CrudResolver.ts`, true);

    await bluebird.each(model.fields.filter(isEnum), async field => {
      const enumName = getEnumName(field);
      await writeToFile(generateEnum(model, field), `${namePath}/enums`, `${enumName}.ts`, true);
    });

    await writeToFile(authChecker, `${namePath}/auth`, `${name}Auth.ts`, false);
    await writeToFile(
      updateOperations,
      `${namePath}/models/update-operations`,
      `${lowerFirst(name)}-update-operations.ts`,
      true,
    );
  }
})();
