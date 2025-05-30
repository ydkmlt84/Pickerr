import { validateConfig } from './validate';

describe('validateConfig', () => {
  const cases: Array<[unknown, string[]]> = [
    [undefined, ['ConfigMustBeRecord']],
    [{}, ['ServersMustBeArray']],
    [{ hostname: 123 }, ['HostNameMustBeString', 'ServersMustBeArray']],
    [{ port: '123' }, ['ServersMustBeArray']],
    [{ port: 'abc' }, ['PortMustBeNumber', 'ServersMustBeArray']],
    [{ port: 123 }, ['ServersMustBeArray']],
    [{ logLevel: 'debug' }, ['ServersMustBeArray']],
    [{ logLevel: 'not a level' }, ['ServersMustBeArray', 'LogLevelInvalid']],
    [{ servers: 123 }, ['ServersMustBeArray']],
    [{ servers: [] }, ['ServersMustNotBeEmpty']],
    [{ servers: [undefined] }, ['ServerMustBeRecord']],
    [{ servers: [{}] }, ['ServerUrlMustBeString', 'ServerTokenMustBeString']],
    [
      { servers: [{ url: 'localhost' }] },
      ['ServerUrlInvalid', 'ServerTokenMustBeString'],
    ],
    [
      { servers: [{ url: 'localhost', token: '' }] },
      ['ServerUrlInvalid', 'ServerTokenMustBeString'],
    ],
    [
      { servers: [{ url: 'localhost', token: 'abc123' }] },
      ['ServerUrlInvalid'],
    ],
    [{ servers: [{ url: 'http://localhost', token: 'abc123' }] }, []],
    [
      {
        servers: [
          { type: 'jellyfin', url: 'http://localhost', token: 'abc123' },
        ],
      },
      ['ServerTypeInvalid'],
    ],
    [
      {
        servers: [
          {
            libraryTitleFilter: 123,
            url: 'http://localhost',
            token: 'abc123',
          },
        ],
      },
      ['ServerLibraryTitleFilterInvalid'],
    ],
    [
      {
        servers: [
          {
            libraryTitleFilter: ['Movies'],
            url: 'http://localhost',
            token: 'abc123',
          },
        ],
      },
      [],
    ],
    [
      {
        servers: [
          {
            libraryTypeFilter: ['Movies'],
            url: 'http://localhost',
            token: 'abc123',
          },
        ],
      },
      ['ServerLibraryTypeFilterInvalid'],
    ],
    [
      {
        servers: [
          {
            libraryTypeFilter: [123],
            url: 'http://localhost',
            token: 'abc123',
          },
        ],
      },
      ['ServerLibraryTypeFilterInvalid'],
    ],
    [
      {
        servers: [
          {
            url: 'http://localhost',
            token: 'abc123',
            linkType: 'app',
          },
        ],
      },
      [],
    ],
    [
      {
        servers: [
          {
            url: 'http://localhost',
            token: 'abc123',
            linkType: 'app',
          },
        ],
      },
      [],
    ],
    [
      {
        servers: [
          {
            url: 'http://localhost',
            token: 'abc123',
            linkType: 'foo',
          },
        ],
      },
      ['ServerLinkTypeInvalid'],
    ],
    [
      {
        rootPath: '/',
      },
      ['ServersMustBeArray', 'ServerBasePathInvalid'],
    ],
    [
      {
        rootPath: 123,
      },
      ['ServersMustBeArray', 'ServerBasePathInvalid'],
    ],
    [{ basicAuth: 'luke:test' }, ['ServersMustBeArray', 'BasicAuthInvalid']],
    [
      { basicAuth: {} },
      [
        'ServersMustBeArray',
        'BasicAuthUserNameInvalid',
        'BasicAuthPasswordInvalid',
      ],
    ],
    [
      { basicAuth: { userName: 'luke' } },
      ['ServersMustBeArray', 'BasicAuthPasswordInvalid'],
    ],
    [
      { basicAuth: { userName: 'luke', password: 'test' } },
      ['ServersMustBeArray'],
    ],
    [
      { requirePlexTvLogin: 'what?' },
      ['RequirePlexTvLoginInvalid', 'ServersMustBeArray'],
    ],
    [{ tlsConfig: '/foo.crt' }, ['TlsConfigInvalid', 'ServersMustBeArray']],
    [
      { tlsConfig: {} },
      [
        'TlsConfigCertFileInvalid',
        'TlsConfigKeyFileInvalid',
        'ServersMustBeArray',
      ],
    ],
  ];

  it.each(cases)(
    'should validate config case %# correctly',
    (input, expected) => {
      const actual = validateConfig(input)
        .map((e) => e.name)
        .sort();
      expect(actual).toEqual(expected.sort());
    },
  );
});
