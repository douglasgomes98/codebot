export type Option<T> = T | undefined;

export const some = <T>(value: T): Option<T> => value;

export const none = <T>(): Option<T> => undefined;

export const isSome = <T>(value: Option<T>): value is T => value !== undefined;

export const isNone = <T>(value: Option<T>): value is undefined =>
  value === undefined;

export const mapOption = <T, U>(
  value: Option<T>,
  fn: (v: T) => U,
): Option<U> => (isSome(value) ? fn(value) : undefined);

export const getOrElse = <T>(value: Option<T>, fallback: T): T =>
  isSome(value) ? value : fallback;
