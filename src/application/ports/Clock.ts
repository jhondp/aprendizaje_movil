export interface Clock {
  /** Local calendar date as YYYY-MM-DD. */
  today(): string;
  /** Full ISO timestamp. */
  now(): string;
}
