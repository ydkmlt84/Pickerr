import { BasicAuth } from '../../../../types/pickerr';
import { getConfig } from '../config/main';
import { RouteHandler } from '../types';

export const isAuthorized = (
  basicAuth: BasicAuth,
  req: Request, // ✅ modern
): boolean => {
  const auth = req.headers.get('Authorization');
  const { userName, password } = basicAuth;

  return auth === `Basic ${btoa(`${userName}:${password}`)}`;
};

export const respondRequiringAuth = (): Response => {
  return new Response(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="MovieMatch", charset="UTF-8"',
    },
  });
};

export const handler: RouteHandler = (req) => {
  const config = getConfig();

  if (!config.basicAuth || isAuthorized(config.basicAuth, req)) {
    return;
  }

  return respondRequiringAuth();
};
