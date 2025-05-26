import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { Config } from '../../../../types/pickerr';
import { resetEnv } from './load_env_test';
import { loadConfig } from './main';

describe('Config -> loadConfig', () => {
  const cases: Array<
    [
      yamlConfig: string | undefined,
      env: Record<string, string>,
      expectedConfig: Partial<Config>,
      expectedErrors: string[],
    ]
  > = [
    [``, {}, {}, ['ServersMustNotBeEmpty']],
    [
      `servers:
  - url: https://plex.example.com
    token: abc123`,
      {},
      {
        hostname: '0.0.0.0',
        port: 8000,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [
          {
            type: 'plex',
            libraryTypeFilter: ['movie'],
            url: 'https://plex.example.com',
            token: 'abc123',
          },
        ],
      },
      [],
    ],
    [
      `port: 8888
servers:
  - url: https://plex.example.com
    token: abc123`,
      {},
      {
        hostname: '0.0.0.0',
        port: 8888,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [
          {
            type: 'plex',
            libraryTypeFilter: ['movie'],
            url: 'https://plex.example.com',
            token: 'abc123',
          },
        ],
      },
      [],
    ],
    [
      `port: 8888
servers:
  - url: https://plex.example.com
    token: abc123`,
      { PORT: '9000', LIBRARY_TYPE_FILTER: 'show' },
      {
        hostname: '0.0.0.0',
        port: 9000,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [
          {
            type: 'plex',
            libraryTypeFilter: ['show'],
            url: 'https://plex.example.com',
            token: 'abc123',
          },
        ],
      },
      [],
    ],
  ];

  const tmpPath = path.join(os.tmpdir(), 'actualConfig.yaml');

  it.each(cases)(
    'should handle loadConfig test %#',
    async (yamlConfig, env, expectedConfig, expectedErrors) => {
      if (yamlConfig) {
        await fs.writeFile(tmpPath, yamlConfig, 'utf8');
      }

      resetEnv(env);

      const [actualConfig, errors] = await loadConfig(
        yamlConfig ? tmpPath : __filename, // fallback to valid path
      );

      if (expectedErrors.length > 0) {
        expect(errors.map((e) => e.name)).toEqual(expectedErrors);
      } else {
        expect(actualConfig).toEqual(expectedConfig);
      }
    },
  );
});
