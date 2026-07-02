import type { AppState, GameState } from './types'

const KEY = 'kbo-mgr-v1'

export function saveGame(state: AppState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function loadGame(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as AppState
    if (!s.teams?.length || s.screen === 'SETUP') return null
    return s
  } catch { return null }
}

export function clearSave(): void {
  try { localStorage.removeItem(KEY) } catch {}
}

const GAME_KEY = 'kbo-mgr-game-v1'

export function saveGameState(state: GameState): void {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(state)) } catch {}
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY)
    return raw ? (JSON.parse(raw) as GameState) : null
  } catch { return null }
}

export function clearGameState(): void {
  try { localStorage.removeItem(GAME_KEY) } catch {}
}
