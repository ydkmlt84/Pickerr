import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { AppService } from '../app.service';
import { ConfigService } from '../config/config.service';
import { ConfigReloadError } from '../config/errors';
import { validateConfig } from '../config/validate';
import { I18nService } from '../i18n/i18n.service';
import { PlexService } from '../plex/plex.service';
import { PlexUser } from '../plex/plex.types';
import {
  AccessDeniedError,
  createRoom,
  getRoom,
  Room,
  RoomNotFoundError,
  UserAlreadyJoinedError,
} from '../room';
import { RouteContext } from '../types';
import {
  ClientMessage,
  Config,
  CreateRoomRequest,
  FilterValueRequest,
  JoinRoomError,
  JoinRoomRequest,
  Locale,
  Login,
  LoginError,
  Rate,
  ServerMessage,
  User,
} from '../types/moviematch';

@Injectable()
export class Client {
  private readonly logger = new Logger(Client.name);
  private finished: Promise<void>;
  private finishResolver!: () => void;
  ws: WebSocket;
  ctx: RouteContext;
  room?: Room;
  anonymousUserName?: string;
  plexUser?: PlexUser;
  isLoggedIn: boolean;
  locale?: Locale;

  constructor(
    ws: WebSocket,
    ctx: RouteContext,
    private configService: ConfigService,
    private plexService: PlexService,
    private i18nService: I18nService,
    private appService: AppService,
  ) {
    this.ws = ws;
    this.ctx = ctx;
    this.isLoggedIn = false;
    this.finished = new Promise((resolve) => {
      this.finishResolver = resolve;
    });

    this.listenForMessages();
    this.sendConfig();
  }

  private sendConfig() {
    if (this.ws.readyState === WebSocket.CLOSED) {
      throw new Error(`Cannot send config when WebSocket is closed`);
    }

    const config = this.configService.getConfig();
    const requiresConfiguration = config.servers.length === 0;

    this.sendMessage({
      type: 'config',
      payload: {
        requiresConfiguration,
        requirePlexLogin: config.requirePlexTvLogin,
        ...(requiresConfiguration
          ? {
              initialConfiguration: config,
            }
          : {}),
      },
    });
  }

  private listenForMessages() {
    this.ws.on('message', async (data: string) => {
      if (this.ws.readyState === WebSocket.CLOSED) return;

      let message: ServerMessage;
      try {
        message = JSON.parse(data);
      } catch (err) {
        this.logger.error(`Failed to parse message: ${data}`, String(err));
        return;
      }

      try {
        switch (message.type) {
          case 'login':
            await this.handleLogin(message.payload);
            break;
          case 'logout':
            await this.handleLogout();
            break;
          case 'createRoom':
            await this.handleCreateRoom(message.payload);
            break;
          case 'joinRoom':
            await this.handleJoinRoom(message.payload);
            break;
          case 'leaveRoom':
            await this.handleLeaveRoom();
            break;
          case 'rate':
            await this.handleRate(message.payload);
            break;
          case 'setLocale':
            await this.handleSetLocale(message.payload);
            break;
          case 'setup':
            await this.handleSetup(message.payload);
            break;
          case 'requestFilters':
            await this.handleRequestFilters();
            break;
          case 'requestFilterValues':
            await this.handleRequestFilterValues(message.payload);
            break;
          default:
            this.logger.log(`Unhandled message: ${data}`);
            break;
        }
      } catch (err) {
        if (err instanceof ConfigReloadError) throw err;
        this.logger.error(`Error handling ${message.type}: ${String(err)}`);
      }
    });

    this.ws.on('close', () => {
      this.logger.debug(`WebSocket connection closed`);
      this.handleClose();
    });

    this.ws.on('error', (error) => {
      this.logger.error(`WebSocket error: ${String(error)}`);
    });
  }

  getUsername() {
    return this.anonymousUserName ?? this.plexUser?.username;
  }

  getUser(): User {
    return {
      userName: this.getUsername()!,
      avatarImage: this.plexUser?.thumb,
    };
  }

  private async handleLogin(login: Login) {
    this.logger.debug(`Handling login event: ${JSON.stringify(login)}`);

    if ('userName' in login) {
      if (this.configService.getConfig().requirePlexTvLogin) {
        this.sendMessage({
          type: 'loginError',
          payload: {
            name: 'PlexLoginRequired',
            message:
              'Anonymous logins are not allowed. Please sign in with Plex.',
          },
        });
        return;
      }

      if (this.anonymousUserName && login.userName !== this.anonymousUserName) {
        this.logger.debug(`Logging out ${this.anonymousUserName}`);
        this.room?.users.delete(this.anonymousUserName);
      }

      this.anonymousUserName = login.userName;
      this.isLoggedIn = true;

      const user: User = {
        userName: login.userName,
        permissions: [],
      };

      this.sendMessage({ type: 'loginSuccess', payload: user });
    } else if ('plexToken' in login) {
      try {
        const plexUser = await this.plexService.getUser({
          plexToken: login.plexToken,
          clientId: login.plexClientId,
        });
        this.plexUser = plexUser;

        const user: User = {
          userName: plexUser.username,
          avatarImage: plexUser.thumb,
          permissions: [],
        };

        this.isLoggedIn = true;

        this.sendMessage({ type: 'loginSuccess', payload: user });
      } catch (err) {
        this.logger.error(`plexAuth invalid!`, err);
      }
    } else {
      const error: LoginError = {
        name: 'MalformedMessage',
        message: 'The login message was not formed correctly.',
      };

      return this.ws.send(JSON.stringify(error));
    }
  }

  private handleLogout() {
    const userName = this.getUsername();
    if (userName) {
      this.room?.users.delete(userName);

      this.isLoggedIn = false;
      delete this.anonymousUserName;
      delete this.plexUser;

      this.sendMessage({ type: 'logoutSuccess' });
    } else {
      this.sendMessage({
        type: 'logoutError',
        payload: {
          name: 'NotLoggedIn',
          message: 'This connection does not have a logged in user associated.',
        },
      });
    }
  }

  private async handleCreateRoom(createRoomReq: CreateRoomRequest) {
    this.logger.debug(
      `Handling room creation event: ${JSON.stringify(createRoomReq)}`,
    );

    const userName = this.getUsername();

    if (!userName) {
      return this.sendMessage({
        type: 'createRoomError',
        payload: {
          name: 'NotLoggedInError',
          message: 'You must be logged in to create a room.',
        },
      });
    }

    try {
      this.room = await createRoom(createRoomReq, this.ctx);
      this.room.users.set(userName, this);
      this.sendMessage({
        type: 'createRoomSuccess',
        payload: {
          previousMatches: await this.room.getMatches(userName!, false),
          media: await this.room.getMediaForUser(userName),
          users: await this.room.getUsers(),
        },
      });
    } catch (err: unknown) {
      const validErrorNames = [
        'NotLoggedInError',
        'RoomExistsError',
        'UnauthorizedError',
        'NoMedia',
      ] as const;
      type ValidErrorName = (typeof validErrorNames)[number];

      const name = validErrorNames.includes(
        (err as Error).name as ValidErrorName,
      )
        ? (err as ValidErrorName)
        : 'NotLoggedInError';

      this.sendMessage({
        type: 'createRoomError',
        payload: {
          name,
          message: err instanceof Error ? err.message : String(err),
        },
      });

      this.logger.error(err);
    }
  }

  private async handleJoinRoom(joinRoomReq: JoinRoomRequest) {
    if (!this.isLoggedIn) {
      return this.sendMessage({
        type: 'joinRoomError',
        payload: {
          name: 'NotLoggedInError',
          message: 'You must log in before trying to join a room.',
        },
      });
    }

    try {
      const userName = this.getUsername();

      if (!userName) {
        throw new Error('No username despite logged in status.');
      }

      this.room = getRoom(userName, joinRoomReq);
      this.room.users.set(userName, this);
      this.sendMessage({
        type: 'joinRoomSuccess',
        payload: {
          previousMatches: await this.room.getMatches(userName!, false),
          media: await this.room.getMediaForUser(userName),
          users: await this.room.getUsers(),
        },
      });
      const userProgress = this.room.userProgress.get(this.getUsername()!) ?? 0;
      const mediaSize = (await this.room.media).size;

      this.room.notifyJoin({
        user: this.getUser(),
        progress: userProgress / mediaSize,
      });
    } catch (err: unknown) {
      let error: JoinRoomError['name'] = 'UnknownError';

      if (err instanceof AccessDeniedError) {
        error = 'AccessDeniedError';
      } else if (err instanceof RoomNotFoundError) {
        error = 'RoomNotFoundError';
      } else if (err instanceof UserAlreadyJoinedError) {
        error = 'UserAlreadyJoinedError';
      }

      return this.sendMessage({
        type: 'joinRoomError',
        payload: {
          name: error,
          message: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  private handleLeaveRoom() {
    this.logger.debug(
      `${this?.anonymousUserName} is leaving ${this.room?.roomName}`,
    );

    const userName = this.getUsername();
    if (this.room && userName) {
      this.room.users.delete(userName);

      this.sendMessage({
        type: 'leaveRoomSuccess',
      });

      this.room.notifyLeave(this.getUser());
    } else {
      return this.sendMessage({
        type: 'leaveRoomError',
        payload: {
          errorType: 'NOT_JOINED',
        },
      });
    }
  }

  private handleRate(rate: Rate) {
    const userName = this.getUsername();
    if (userName) {
      this.logger.debug(
        `Handling rate event: ${userName} ${JSON.stringify(rate)}`,
      );
      this.room?.storeRating(userName, rate, Date.now());
    }
  }

  private async handleSetLocale(locale: Locale) {
    this.locale = locale;

    const headers = new Headers({
      'accept-language': locale.language,
    });

    this.sendMessage({
      type: 'translations',
      payload: await this.i18nService.getTranslations(headers),
    });
  }

  private handleClose() {
    this.logger.log(`${this.getUsername() ?? 'Unknown user'} left.`);
    this.handleLeaveRoom();
    this.finishResolver();
  }

  private async handleSetup(config: Config) {
    const currentConfig = this.configService.getConfig();
    if (currentConfig.servers.length === 0) {
      const configErrors = validateConfig(config);
      if (configErrors.length) {
        this.sendMessage({
          type: 'setupError',
          payload: {
            message: JSON.stringify(configErrors),
            type: 'INVALID_CONFIG',
          },
        });
        this.logger.error(
          `Tried to setup with an invalid config. ${String(configErrors)}`,
        );
      } else {
        await this.configService.updateConfiguration(config);

        this.sendMessage({
          type: 'setupSuccess',
          payload: { hostname: config.hostname, port: config.port },
        });

        this.appService.shutdown();
      }
    } else {
      this.sendMessage({
        type: 'setupError',
        payload: {
          message: 'MovieMatch has already been set up',
          type: 'ALREADY_SETUP',
        },
      });
      this.logger.log(
        `An attempt was made to configure MovieMatch after it has been initially set up.`,
      );
      this.logger.log(
        `Please edit the configuration YAML directly and restart MovieMatch.`,
      );
    }
  }

  async handleRequestFilters() {
    if (this.ctx.providers.length) {
      const [provider] = this.ctx.providers;
      const filters = await provider.getFilters();
      this.sendMessage({
        type: 'requestFiltersSuccess',
        payload: filters,
      });
    } else {
      this.sendMessage({
        type: 'requestFiltersError',
      });
    }
  }

  async handleRequestFilterValues(filterValueRequest: FilterValueRequest) {
    if (this.ctx.providers.length) {
      const [provider] = this.ctx.providers;
      const filterValues = await provider.getFilterValues(
        filterValueRequest.key,
      );
      this.sendMessage({
        type: 'requestFilterValuesSuccess',
        payload: {
          request: filterValueRequest,
          values: filterValues,
        },
      });
    } else {
      this.sendMessage({
        type: 'requestFilterValuesError',
      });
    }
  }

  async sendMessage(msg: ClientMessage) {
    try {
      await this.ws.send(JSON.stringify(msg));
    } catch (_err) {
      this.logger.warn(`Tried to send message to a disconnected client`);
    }
  }
}
