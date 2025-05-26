import { readFile, stat } from 'fs/promises';
import { lookup } from 'mime-types';
import path from 'path';
import { RouteHandler } from '../types';

const isGzipped = (bytes: Uint8Array) => bytes[0] === 31 && bytes[1] === 139;

export const serveStatic =
  (rootPaths: string[]): RouteHandler =>
  async (req: Request): Promise<Response> => {
    const urlPath = new URL(req.url).pathname;

    for (const rootPath of rootPaths) {
      const filePath = path.join(rootPath, urlPath);

      try {
        await stat(filePath); // check existence

        const file = await readFile(filePath);
        const headers = new Headers();

        headers.set(
          'content-type',
          lookup(filePath) || 'application/octet-stream',
        );

        if (isGzipped(file)) {
          headers.set('content-encoding', 'gzip');
        }

        return new Response(file, {
          status: 200,
          headers,
        });
      } catch {
        // Try next rootPath
        continue;
      }
    }

    return new Response(`${urlPath} was not found`, {
      status: 404,
      headers: { 'content-type': 'text/plain' },
    });
  };

export const handler = serveStatic(['./web/app/build']);
