const PREFIX = '[firebase]'

export const logWarn = (message: string, error?: unknown): void => {
  if (error instanceof Error) {
    console.warn(`${PREFIX} ${message}`, error.message)
    return
  }
  if (error !== undefined) {
    console.warn(`${PREFIX} ${message}`, error)
    return
  }
  console.warn(`${PREFIX} ${message}`)
}

export const logError = (message: string, error?: unknown): void => {
  if (error instanceof Error) {
    console.error(`${PREFIX} ${message}`, error.message)
    return
  }
  if (error !== undefined) {
    console.error(`${PREFIX} ${message}`, error)
    return
  }
  console.error(`${PREFIX} ${message}`)
}
