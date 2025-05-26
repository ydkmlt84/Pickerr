import fs from 'fs/promises';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { Config } from '../../../../types/pickerr';
import { isRecord } from '../util/assert';
import { ConfigFileNotFoundError } from './errors';

// This is a no-op stub to replace the Deno permission API
export const requestRead = async (_path: string): Promise<boolean> => true;

export const loadFromYaml = async (
  filePath: string,
): Promise<Partial<Config>> => {
  let config: Partial<Config> = {};

  if (!(await requestRead('.'))) {
    console.error(
      'Unable to load config file. Permission was denied for reading the current directory.',
    );
    return config;
  }

  try {
    const fullPath = path.resolve(filePath);
    const fileContents = await fs.readFile(fullPath, 'utf-8');

    const parsed = parseYaml(fileContents);
    isRecord(parsed, filePath);

    config = parsed;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new ConfigFileNotFoundError(`${filePath} does not exist`);
    }
    throw err;
  }

  return config;
};
