import { LibaryTypes, LibraryType } from '../../../../types/pickerr';
import { addRedaction } from '../logger';
import {
  assert,
  isRecord,
  pickerrError, // renamed from MovieMatchError
} from '../util/assert';
import {
  BasicAuthInvalid,
  BasicAuthPasswordInvalid,
  BasicAuthUserNameInvalid,
  ConfigMustBeRecord,
  HostNameMustBeString,
  LogLevelInvalid,
  PortMustBeNumber,
  RequirePlexTvLoginInvalid,
  ServerBasePathInvalid,
  ServerLibraryTitleFilterInvalid,
  ServerLibraryTypeFilterInvalid,
  ServerLinkTypeInvalid,
  ServerMustBeRecord,
  ServersMustBeArray,
  ServersMustNotBeEmpty,
  ServerTokenMustBeString,
  ServerTypeInvalid,
  ServerUrlInvalid,
  ServerUrlMustBeString,
  TlsConfigCertFileInvalid,
  TlsConfigInvalid,
  TlsConfigKeyFileInvalid,
} from './errors';

function pushError(err: unknown, errors: pickerrError[]) {
  if (err instanceof Error) {
    errors.push(err);
  } else {
    errors.push(new Error(String(err)));
  }
}

// Define valid log levels manually if not using a logger lib
const validLogLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

export const validateConfig = (value: any): pickerrError[] => {
  const errors: pickerrError[] = [];

  try {
    isRecord(value, 'config', ConfigMustBeRecord);

    if (value.hostname && typeof value.hostname !== 'string') {
      errors.push(new HostNameMustBeString('hostname must be a string'));
    }

    if (value.port) {
      if (typeof value.port === 'string') {
        value.port = Number(value.port);
      }

      if (Number.isNaN(value.port)) {
        errors.push(new PortMustBeNumber('Port must be a number'));
      }
    }

    if (value.logLevel) {
      if (typeof value.logLevel === 'string') {
        const logLevel = value.logLevel.toUpperCase();
        value.logLevel = logLevel;

        if (!validLogLevels.includes(logLevel)) {
          errors.push(
            new LogLevelInvalid(
              `logLevel must be one of: ${validLogLevels.join(', ')}`,
            ),
          );
        }
      } else {
        errors.push(new LogLevelInvalid('logLevel must be a string'));
      }
    }

    if (!Array.isArray(value.servers)) {
      errors.push(new ServersMustBeArray('servers must be an Array'));
    } else if (value.servers.length === 0) {
      errors.push(
        new ServersMustNotBeEmpty('At least one server must be configured'),
      );
    } else {
      for (const server of value.servers) {
        try {
          isRecord(server, 'server', ServerMustBeRecord);

          if (server.type && server.type !== 'plex') {
            errors.push(
              new ServerTypeInvalid(`"plex" is the only valid server type`),
            );
          }

          if (typeof server.url !== 'string') {
            errors.push(
              new ServerUrlMustBeString('a server url must be specified'),
            );
          } else {
            try {
              new URL(server.url);
            } catch (err) {
              errors.push(new ServerUrlInvalid(String(err)));
            }
            addRedaction(server.url);
          }

          if (typeof server.token !== 'string' || server.token.length === 0) {
            errors.push(
              new ServerTokenMustBeString('a server token must be specified'),
            );
          } else {
            addRedaction(server.token);
          }

          if (server.libraryTitleFilter) {
            if (!Array.isArray(server.libraryTitleFilter)) {
              errors.push(
                new ServerLibraryTitleFilterInvalid(
                  'libraryTitleFilter must be a list of strings',
                ),
              );
            } else {
              for (const title of server.libraryTitleFilter) {
                if (typeof title !== 'string') {
                  errors.push(
                    new ServerLibraryTitleFilterInvalid(
                      'libraryTitleFilter must only contain strings',
                    ),
                  );
                }
              }
            }
          }

          if (server.libraryTypeFilter) {
            if (!Array.isArray(server.libraryTypeFilter)) {
              errors.push(
                new ServerLibraryTypeFilterInvalid(
                  'libraryTypeFilter must be a list of strings',
                ),
              );
            } else {
              for (const type of server.libraryTypeFilter as string[]) {
                if (!LibaryTypes.includes(type as LibraryType)) {
                  errors.push(
                    new ServerLibraryTypeFilterInvalid(
                      `libraryTypeFilter must be one of ${LibaryTypes.join(
                        ', ',
                      )}. Got "${type}"`,
                    ),
                  );
                }
              }
            }
          }

          if (server.linkType) {
            const validLinkTypes = ['app', 'webLocal', 'webExternal'];
            if (
              typeof server.linkType !== 'string' ||
              !validLinkTypes.includes(server.linkType)
            ) {
              errors.push(
                new ServerLinkTypeInvalid(
                  `linkType must be one of: ${validLinkTypes.join(
                    ', ',
                  )}. Got "${server.linkType}"`,
                ),
              );
            }
          }
        } catch (err) {
          pushError(err, errors);
        }
      }
    }

    if (value.rootPath) {
      if (typeof value.rootPath !== 'string') {
        errors.push(new ServerBasePathInvalid('rootPath must be a string'));
      } else if (value.rootPath === '/') {
        errors.push(new ServerBasePathInvalid('rootPath must not be "/"'));
      }
    }

    if (value.basicAuth) {
      try {
        isRecord(value.basicAuth, 'basicAuth', BasicAuthInvalid);

        if (typeof value.basicAuth.userName !== 'string') {
          errors.push(
            new BasicAuthUserNameInvalid('basicAuth.userName must be a string'),
          );
        }

        if (typeof value.basicAuth.password !== 'string') {
          errors.push(
            new BasicAuthPasswordInvalid('basicAuth.password must be a string'),
          );
        }
      } catch (err) {
        pushError(err, errors);
      }
    }

    if (value.requirePlexTvLogin !== undefined) {
      try {
        assert(
          typeof value.requirePlexTvLogin === 'boolean',
          'requirePlexTvLogin must be a boolean',
          RequirePlexTvLoginInvalid,
        );
      } catch (err) {
        pushError(err, errors);
      }
    }

    if (value.tlsConfig) {
      try {
        isRecord(value.tlsConfig, 'tlsConfig', TlsConfigInvalid);
        if (typeof value.tlsConfig.certFile !== 'string') {
          errors.push(new TlsConfigCertFileInvalid());
        }
        if (typeof value.tlsConfig.keyFile !== 'string') {
          errors.push(new TlsConfigKeyFileInvalid());
        }
      } catch (err) {
        pushError(err, errors);
      }
    }
  } catch (err) {
    pushError(err, errors);
  }

  return errors;
};
