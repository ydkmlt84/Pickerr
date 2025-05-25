import { log } from "/deps.ts";
import { RouteContext } from "/internal/app/moviematch/types.ts";
import { Client } from "/internal/app/moviematch/client.ts";

export const handler = (req: Request, ctx: RouteContext): Response => {
  try {
    const { response, socket } = Deno.upgradeWebSocket(req);

    const client = new Client(socket, ctx);
    client.finished.catch((err: unknown) => {
      log.error(
        `Client error: ${err instanceof Error ? err.message : String(err)}`
      );
    });

    return response;
  } catch (err) {
    log.error(
      `Failed to upgrade to WebSocket: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return new Response("WebSocket upgrade failed", { status: 400 });
  }
};
