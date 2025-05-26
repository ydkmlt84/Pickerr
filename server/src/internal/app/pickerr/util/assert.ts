export class pickerrError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class pickerrUnknownError extends Error {
  override name = 'pickerrUnknownError';
}

export function assert(
  expr: unknown,
  msg = '',
  ErrorType = pickerrUnknownError,
): asserts expr {
  if (!expr) {
    throw new ErrorType(msg);
  }
}

export function isRecord(
  value: unknown,
  name = 'value',
  ErrorType = pickerrError,
): asserts value is Record<string, unknown> {
  assert(
    typeof value === 'object' && value !== null,
    `${name} must be an object`,
    ErrorType,
  );
}
