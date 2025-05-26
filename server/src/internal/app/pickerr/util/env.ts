export const getEnv = (name: string): string | undefined => {
  return process.env[name];
};
