import { Client } from '../client';
import { RouteContext } from '../types';

export const handler = {
  fetch(req: Request, ctx: RouteContext): Response | Promise<Response> {
    if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Not a WebSocket request', { status: 400 });
    }

    try {
      const { response, socket } = req.upgrade();

      const client = new Client(socket, ctx);
      client.finished.catch((err: unknown) => {
        console.error(
          `Client error: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

      return response;
    } catch (err) {
      console.error(
        `Failed to upgrade to WebSocket: ${err instanceof Error ? err.message : String(err)}`,
      );
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
  },
};
