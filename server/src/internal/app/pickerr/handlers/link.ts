import { RouteContext } from '../types';

export const handler = async (
  req: Request,
  ctx: RouteContext,
): Promise<Response> => {
  const { providerIndex, key } = ctx.params ?? {};
  if (!key || !providerIndex) {
    return new Response('Missing provider index or key', { status: 400 });
  }

  const provider = ctx.providers[+providerIndex];
  if (!provider) {
    return new Response('Invalid provider index', { status: 404 });
  }

  const url = await provider.getCanonicalUrl(key, {
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  if (!url) {
    return new Response('Redirect URL not found', { status: 404 });
  }

  return new Response(url, {
    status: 302,
    headers: {
      location: url,
    },
  });
};
