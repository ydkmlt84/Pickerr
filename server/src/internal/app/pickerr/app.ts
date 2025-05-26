import type { Config } from '../../../types/pickerr';
import { handler as apiHandler } from './handlers/api';
import { handler as basicAuthHandler } from './handlers/basic_auth';
import { handler as healthHandler } from './handlers/health';
import { handler as linkHandler } from './handlers/link';
import { handler as posterHandler } from './handlers/poster';
import { handler as serveStaticHandler } from './handlers/serve_static';
import { handler as rootHandler } from './handlers/template';
import { createProvider as createPlexProvider } from './providers/plex';
import type { MovieMatchProvider } from './providers/types';
import type { RouteHandler } from './types';
import { urlFromReqUrl } from './util/url';

export class ProviderUnavailableError extends Error {}

let appAbortController: AbortController;

export const shutdown = () => {
  if (appAbortController) {
    appAbortController.abort();
  }
};

const routes: Array<readonly [RegExp | string, RouteHandler[]]> = [
  ['/', [basicAuthHandler, rootHandler]],
  ['/health', [healthHandler]],
  ['/api/ws', [apiHandler.fetch]],
  [
    /^\/api\/poster\/(?<providerIndex>[0-9]+)\/(?<key>[0-9/]+)$/,
    [basicAuthHandler, posterHandler],
  ],
  [
    /^\/api\/link\/(?<providerIndex>[0-9]+)\/(?<key>[0-9a-z/]+)$/i,
    [basicAuthHandler, linkHandler],
  ],
  ['/manifest.webmanifest', [serveStaticHandler]],
  [/.*/, [basicAuthHandler, serveStaticHandler]],
];

export const Application = async (
  config: Config,
): Promise<{ statusCode: number }> => {
  const providers: MovieMatchProvider[] = config.servers.map(
    (server, index) => {
      if (server.type && server.type !== 'plex') {
        throw new Error(`Unhandled server type: ${server.type}`);
      }
      return createPlexProvider(String(index), server);
    },
  );

  for (const provider of providers) {
    const available = await provider.isAvailable();
    if (!available) {
      throw new ProviderUnavailableError(provider.options.url.slice(0, 5));
    }
  }

  console.info(`Server listening on http://${config.hostname}:${config.port}`);

  appAbortController = new AbortController();

  Bun.serve({
    hostname: config.hostname,
    port: config.port,
    signal: appAbortController.signal,
    async fetch(req: Request): Promise<Response> {
      const url = urlFromReqUrl(req.url);

      const matched = routes.find(([path]) =>
        typeof path === 'string'
          ? path === url.pathname
          : path.test(url.pathname),
      );

      if (!matched) {
        console.warn(`No route matched for ${url.pathname}`);
        return new Response('Not found', { status: 404 });
      }

      const [path, handlers] = matched;

      let params: Record<string, string> | undefined;
      if (path instanceof RegExp) {
        params = path.exec(url.pathname)?.groups;
      }

      for (const handler of handlers) {
        const response = await handler(req, {
          providers,
          config,
          path,
          params,
        });

        if (response) return response;
      }

      return new Response('Not found', { status: 404 });
    },
  } as any);

  return { statusCode: 0 };
};
