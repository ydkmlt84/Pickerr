import fs from 'fs/promises';
import path from 'path';
import { Config } from '../../../../types/pickerr';
import { getConfig } from '../config/main';
import { getTranslations } from '../i18n';
import { RouteHandler } from '../types';
import { memo } from '../util/memo';
import { getVersion } from '../version';

type KVP = { [key: string]: string | KVP };

const get = (context: KVP, keyPath: string[]): string =>
  String(
    keyPath.reduce(
      (subContext: string | KVP, key: string) =>
        typeof subContext === 'object' ? (subContext[key] ?? '') : subContext,
      context,
    ),
  );

const interpolate = (template: string, context: KVP): string => {
  for (const [, match, name] of template.matchAll(/\$\{([a-z0-9_.]+)\}/gi)) {
    template = template.replace(match, get(context, name.split('.')));
  }
  return template;
};

const getTemplate = memo(async () => {
  const filePath = path.join(process.cwd(), 'web/template/index.html');
  return await fs.readFile(filePath, 'utf8');
});

const getRootPath = (req: Request, config: Config) => {
  const forwardedPrefix = req.headers.get('x-forwarded-prefix');
  return (forwardedPrefix ?? config.rootPath ?? '').trim().replace(/\/$/, '');
};

export const handler: RouteHandler = async (
  req: Request,
): Promise<Response> => {
  const config = getConfig();
  const translations = await getTranslations(req.headers);
  const template = await getTemplate();

  const html = interpolate(template, {
    ...translations,
    config: config as unknown as KVP,
    rootPath: getRootPath(req, config),
    version: await getVersion(),
  });

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
};
