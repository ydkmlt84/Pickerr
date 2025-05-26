// bun.d.ts
interface BunWebSocketPair {
  response: Response;
  socket: WebSocket;
}

interface Request {
  upgrade(): BunWebSocketPair;
}
