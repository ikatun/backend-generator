import appRoot from 'app-root-path';
import fs from 'fs';
import path from 'path';

import { IGeneratorContext } from './generator-context';

export function fileToGeneratorContext(dir: string, name: string): IGeneratorContext {
  const dirName = appRoot.resolve(dir);
  const filePath = path.join(dirName, name);
  let existingContent;
  try {
    existingContent = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    existingContent = '';
  }

  return { existingContent };
}
