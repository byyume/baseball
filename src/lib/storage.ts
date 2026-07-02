import type { AppState } from './types'

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
