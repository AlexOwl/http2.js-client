// tslint:disable-next-line: no-empty
const noop = () => {}
const noopLog = {
  debug: noop,
  error: noop,
  fatal: noop,
  info: noop,
  trace: noop,
  warn: noop,

  child: () => noopLog
}

export { noop, noopLog }
