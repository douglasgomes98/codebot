export type { AppError, ErrorCode } from './AppError';
export { makeError } from './AppError';

export type { Option } from './Option';
export { getOrElse, isNone, isSome, mapOption, none, some } from './Option';
export type { Result } from './Result';
export { err, flatMapResult, isErr, isOk, mapResult, ok } from './Result';
