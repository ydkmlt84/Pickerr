import { Config } from '../../../../types/pickerr';
import { applyDefaults } from './defaults';

describe('Config -> applyDefaults', () => {
  const cases: Array<[Partial<Config>, Partial<Config>]> = [
    [
      {},
      {
        hostname: '0.0.0.0',
        port: 8000,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [],
      },
    ],
    [
      { hostname: '127.0.0.1' },
      {
        hostname: '127.0.0.1',
        port: 8000,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [],
      },
    ],
    [
      { hostname: '127.0.0.1', port: 8888 },
      {
        hostname: '127.0.0.1',
        port: 8888,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [],
      },
    ],
    [
      { hostname: '127.0.0.1', port: 8888, logLevel: 'DEBUG' },
      {
        hostname: '127.0.0.1',
        port: 8888,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [],
      },
    ],
    [
      {
        hostname: '127.0.0.1',
        port: 8888,
        logLevel: 'DEBUG',
        rootPath: '/moviematch',
        servers: [],
      },
      {
        hostname: '127.0.0.1',
        port: 8888,
        logLevel: 'DEBUG',
        rootPath: '/moviematch',
        servers: [],
      },
    ],
    [
      {
        hostname: '127.0.0.1',
        port: 8888,
        servers: [{} as unknown as Config['servers'][number]],
      },
      {
        hostname: '127.0.0.1',
        port: 8888,
        logLevel: 'DEBUG',
        rootPath: '',
        servers: [
          {
            type: 'plex',
            libraryTypeFilter: ['movie'],
          } as unknown as Config['servers'][number],
        ],
      },
    ],
  ];

  it.each(cases)('should apply defaults for %#', (partialConfig, expected) => {
    const actual = applyDefaults(partialConfig);
    expect(actual).toEqual(expected);
  });
});
