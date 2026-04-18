export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ success: true, value });

export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export const isOk = <T, E>(
  result: Result<T, E>,
): result is { success: true; value: T } => result.success;

export const isErr = <T, E>(
  result: Result<T, E>,
): result is { success: false; error: E } => !result.success;

export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> =>
  isOk(result) ? ok(fn(result.value)) : (result as unknown as Result<U, E>);

export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> =>
  isOk(result) ? fn(result.value) : (result as unknown as Result<U, E>);
