/**
 * Typed access to the build-time environment.
 *
 * Reading `import.meta.env` in exactly one place means a missing variable fails
 * loudly at startup instead of surfacing as an undefined URL deep in a request.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and set it.`,
    )
  }
  return value
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
  appName: import.meta.env.VITE_APP_NAME ?? 'Splitwise',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
