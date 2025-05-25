import { Deferred, deferred, log } from "/deps.ts";
import { Config } from "/types/moviematch.ts";
import { handler as serveStaticHandler } from "/internal/app/moviematch/handlers/serve_static.ts";
import { handler as rootHandler } from "/internal/app/moviematch/handlers/template.ts";
import { handler as healthHandler } from "/internal/app/moviematch/handlers/health.ts";
import { handler as apiHandler } from "/internal/app/moviematch/handlers/api.ts";
import { handler as basicAuthHandler } from "/internal/app/moviematch/handlers/basic_auth.ts";
import { handler as posterHandler } from "/internal/app/moviematch/handlers/poster.ts";
import { handler as linkHandler } from "/internal/app/moviematch/handlers/link.ts";
import { urlFromReqUrl } from "/internal/app/moviematch/util/url.ts";

import { createProvider as createPlexProvider } from "/internal/app/moviematch/providers/plex.ts";
import type { MovieMatchProvider } from "/internal/app/moviematch/providers/types.ts";
import { requestNet } from "/internal/app/moviematch/util/permission.ts";
import type { RouteHandler } from "./types.ts";

export class ProviderUnavailableError extends Error {}

const routes: Array<readonly [RegExp | string, RouteHandler[]]> = [
  ["/", [basicAuthHandler, rootHandler]],
  ["/health", [healthHandler]],
  ["/api/ws", [apiHandler]],
  [/^\/api\/poster\/(?<providerIndex>[0-9]+)\/(?<key>[0-9/]+)$/, [basicAuthHandler, posterHandler]],
  [/^\/api\/link\/(?<providerIndex>[0-9]+)\/(?<key>[0-9a-z/]+)$/i, [basicAuthHandler, linkHandler]],
  ["/manifest.webmanifest", [serveStaticHandler]],
  [/.*/, [basicAuthHandler, serveStaticHandler]],
];

let appAbortController: AbortController;

export const shutdown = () => {
  if (appAbortController) {
    appAbortController.abort();
  }
};

interface ApplicationInstance {
  statusCode: Deferred<number | undefined>;
}

export const Application = (
  config: Config,
  signal?: AbortSignal,
): ApplicationInstance => {
  const statusCode = deferred<number | undefined>();

  (async () => {
    let appStatusCode: number | undefined = 0;

    const providers: MovieMatchProvider[] = config.servers.map((server, index) => {
      if (typeof server.type === "string" && server.type !== "plex") {
        throw new Error(`server type ${server.type} unhandled.`);
      }
      return createPlexProvider(String(index), server);
    });

    for (const provider of providers) {
      if (!await provider.isAvailable()) {
        throw new ProviderUnavailableError(provider.options.url.slice(0, 5));
      }
    }

    if (!await requestNet(`${config.hostname}:${config.port}`)) {
      log.critical(
        `Permission denied: Cannot start MovieMatch on ${config.hostname}:${config.port}`,
      );
      Deno.exit(1);
    }

    appAbortController = new AbortController();

    log.info(`Server listening on http://${config.hostname}:${config.port}`);

    Deno.serve(
      { hostname: config.hostname, port: config.port, signal: appAbortController.signal },
      async (req) => {
        const url = urlFromReqUrl(req.url);
        const [path, handlers] = routes.find(([path]) =>
          typeof path === "string" ? path === url.pathname : path.test(url.pathname)
        ) ?? [];

        if (!handlers || !path) {
          log.error(`No handlers for ${url.pathname}`);
          return new Response("Not found", { status: 404 });
        }

        let response;
        let params;

        if (path instanceof RegExp) {
          params = path.exec(url.pathname)?.groups;
        }

        for (const handler of handlers) {
          response = await handler(req, {
            providers,
            config,
            path,
            params,
          });
          if (response) break;
        }

        return response ?? new Response("Not found", { status: 404 });
      },
    );

    statusCode.resolve(appStatusCode);
  })();

  return {
    statusCode,
  };
};
