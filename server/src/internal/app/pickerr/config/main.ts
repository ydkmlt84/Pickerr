import fs from 'fs/promises';
import path from 'path';
import { stringify } from 'yaml';
import { Config } from '../../../../types/pickerr';
import { pickerrError } from '../util/assert';
import { applyDefaults } from './defaults';
import { loadFromEnv } from './load_env';
import { loadFromYaml } from './load_yaml';
import { validateConfig } from './validate';

// Stubs for now — you could later use fs.access() to simulate read/write perms
export const requestRead = async (_: string) => true;
export const requestWrite = async (_: string) => true;

let configPath: string | undefined;
let cachedConfig: Config;

export function getConfig() {
  if (!cachedConfig) {
    throw new Error(`getConfig was called before the config was loaded.`);
  }
  return cachedConfig;
}

export async function loadConfig(
  customPath?: string,
): Promise<[config: Config, errors: pickerrError[]]> {
  const envConfig = await loadFromEnv();
  let yamlConfig: Partial<Config> = {};

  try {
    if (await requestRead('.')) {
      const yamlConfigPath =
        customPath ?? path.join(process.cwd(), 'config.yaml');
      configPath = yamlConfigPath;

      console.info(`Looking for config in ${yamlConfigPath}`);
      yamlConfig =
        yamlConfigPath !== '/dev/null'
          ? await loadFromYaml(yamlConfigPath)
          : {};
    }
  } catch (err) {
    if (customPath) {
      throw err;
    }
  }

  const serversLength = Math.max(
    yamlConfig?.servers?.length ?? 0,
    envConfig?.servers?.length ?? 0,
    0,
  );

  const mergedServers =
    serversLength !== 0
      ? Array.from({ length: serversLength }).map((_, index) => ({
          ...(yamlConfig?.servers ?? [])[index],
          ...(envConfig?.servers ?? [])[index],
        }))
      : [];

  const config: Partial<Config> = applyDefaults({
    ...yamlConfig,
    ...envConfig,
    ...(mergedServers.length > 0 ? { servers: mergedServers } : {}),
  });

  const configErrors = validateConfig(config);
  cachedConfig = config as Config;

  return [cachedConfig, configErrors];
}

export async function updateConfiguration(config: Record<string, unknown>) {
  cachedConfig = config as unknown as Config;

  const yamlConfig = stringify(config, { indent: 2 });
  const defaultConfigPath = path.join(process.cwd(), 'config.yaml');

  if (await requestWrite(configPath ?? defaultConfigPath)) {
    await fs.writeFile(configPath ?? defaultConfigPath, yamlConfig, 'utf8');
  }
}
