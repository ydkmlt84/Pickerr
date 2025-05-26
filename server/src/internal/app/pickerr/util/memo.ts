export const memo = <T>(fn: (...args: any[]) => T): ((...args: any[]) => T) => {
  let cachedResult: T;
  let hasRun = false;

  return (...args: any[]) => {
    if (!hasRun) {
      cachedResult = fn(...args);
      hasRun = true;
    }
    return cachedResult;
  };
};

export const memo1 = <T>(
  fn: (key: string, ...args: any[]) => T,
): ((key: string, ...args: any[]) => T) => {
  const cachedResult = new Map<string, T>();

  return (key: string, ...args: any[]) => {
    if (cachedResult.has(key)) {
      return cachedResult.get(key)!;
    } else {
      const result = fn(key, ...args);
      cachedResult.set(key, result);
      return result;
    }
  };
};
