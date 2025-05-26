import { RouteContext } from '../types';
import { urlFromReqUrl } from '../util/url';

interface PosterParams {
  providerIndex: string;
  key: string;
}

export const handler = async (
  req: Request,
  ctx: RouteContext,
): Promise<Response> => {
  if (!ctx.params) {
    console.warn('poster handler called without params');
    return new Response('Missing parameters', { status: 400 });
  }

  const { providerIndex, key } = ctx.params as unknown as PosterParams;

  const provider = ctx.providers[+providerIndex];

  if (!provider) {
    console.warn(`poster handler called with an invalid provider index`);
    return new Response('Invalid provider index', { status: 404 });
  }

  const search = urlFromReqUrl(req.url).searchParams;
  const width = search.get('width') ? Number(search.get('width')) : 600;

  try {
    const [readableStream, headers] = await provider.getArtwork(key, width);

    return new Response(readableStream, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return new Response('Failed to fetch artwork', { status: 500 });
  }
};
