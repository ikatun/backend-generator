import fs from 'fs';
import path from 'path';

import { IGeneratorContext } from './generator-context';

export function fileToGeneratorContext(dirName: string, name: string): IGeneratorContext {
  const filePath = path.join(dirName, name);
  let existingContent;
  try {
    existingContent = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    existingContent = '';
  }

  return { existingContent };
}
