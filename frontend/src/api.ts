// Client for the game API. The API URL comes from /config.json, written at
// deploy time, or VITE_API_URL in development.

export interface Game {
  sessionId: string
  theme: string
  difficulty: string
  /** The keeper's instructions, with the secret masked. */
  context: string
}

export type GuessResult = { correct: false } | { correct: true; secret: string }

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`API error ${status}: ${code}`)
  }
}

let apiUrl: Promise<string> | undefined

async function resolveApiUrl(): Promise<string> {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' })
    // Without a config file the dev server and CloudFront both answer with index.html
    if (response.ok && response.headers.get('content-type')?.includes('json')) {
      const config = await response.json()
      if (typeof config.apiUrl === 'string') return config.apiUrl.replace(/\/$/, '')
    }
  } catch {
    // fall through to the build-time URL
  }
  return (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

async function post<T>(path: string, body: object): Promise<T> {
  apiUrl ??= resolveApiUrl()
  const response = await fetch(`${await apiUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, data.error ?? 'unknown_error')
  return data as T
}

export const startGame = () => post<Game>('/game', {})

export const sendMessage = (sessionId: string, text: string) =>
  post<{ reply: string }>(`/game/${sessionId}/message`, { text })

export const submitGuess = (sessionId: string, guess: string) =>
  post<GuessResult>(`/game/${sessionId}/guess`, { guess })
