'use client'
import { useState, useCallback, useEffect } from 'react'
import type { AppState, SeriesState, TeamColor, Round, InningMode, PitchMode } from '@/lib/types'
import { buildTeamsFromKBO, KBO_TEAMS } from '@/lib/defaultData'
import { saveGame, loadGame, clearSave } from '@/lib/storage'
import TeamSetupScreen from '@/components/TeamSetupScreen'
import BracketScreen from '@/components/BracketScreen'
import GameScreen from '@/components/GameScreen'

const PLAYER_TEAM_INDEX = 4 // always placed at 5th

function createInitialState(): AppState {
  return {
    screen: 'SETUP',
    teams: [],
    playerTeamIndex: PLAYER_TEAM_INDEX,
    series: null,
    seriesHistory: [],
    inningMode: 'full',
    pitchMode: 'all',
    selectedKBOTeamId: null,
  }
}

// ─── Postseason helpers ───────────────────────────────────────────

function buildWildcardSeries(teams: AppState['teams']): SeriesState {
  return {
    round: 'wildcard',
    homeTeam: teams[3],  // 4th place is home
    awayTeam: teams[4],  // 5th place (player) is away
    homeWins: 0,
    awayWins: 0,
    maxWins: 2,
    playerIsHome: false,
  }
}

function getNextRound(r: Round): Round | null {
  return ({ wildcard: 'semipo', semipo: 'po', po: 'ks', ks: null } as const)[r]
}

function isSeriesOver(s: SeriesState): 'home' | 'away' | null {
  if (s.round === 'wildcard') {
    if (s.homeWins >= 1) return 'home'
    if (s.awayWins >= s.maxWins) return 'away'
    return null
  }
  if (s.homeWins >= s.maxWins) return 'home'
  if (s.awayWins >= s.maxWins) return 'away'
  return null
}

function buildNextSeries(teams: AppState['teams'], playerIdx: number, nextRound: Round): SeriesState {
  const opponentByRound: Record<Round, number> = { wildcard: 3, semipo: 2, po: 1, ks: 0 }
  const maxByRound: Record<Round, number> = { wildcard: 2, semipo: 3, po: 3, ks: 4 }
  return {
    round: nextRound,
    homeTeam: teams[opponentByRound[nextRound]],
    awayTeam: teams[playerIdx],
    homeWins: 0,
    awayWins: 0,
    maxWins: maxByRound[nextRound],
    playerIsHome: false,
  }
}

// ─── Main Component ───────────────────────────────────────────────

type SetupParams = {
  selectedTeamId: number
  inningMode: InningMode
  pitchMode: PitchMode
  overrides: Partial<{ name: string; shortName: string; color: TeamColor }>[]
}

const ROUND_LABELS_SAVE: Record<string, string> = {
  wildcard: '와일드카드', semipo: '준플레이오프', po: '플레이오프', ks: '한국시리즈'
}

export default function Home() {
  const [app, setApp] = useState<AppState>(createInitialState)
  const [savedState, setSavedState] = useState<AppState | null>(null)

  useEffect(() => {
    setSavedState(loadGame())
  }, [])

  useEffect(() => {
    if (app.screen === 'SETUP') return
    saveGame(app)
  }, [app])

  const handleSetupDone = useCallback(({ selectedTeamId, inningMode, pitchMode, overrides }: SetupParams) => {
    const { teams } = buildTeamsFromKBO(selectedTeamId, overrides)
    const series = buildWildcardSeries(teams)
    setApp(prev => ({
      ...prev,
      screen: 'BRACKET',
      teams,
      selectedKBOTeamId: selectedTeamId,
      inningMode,
      pitchMode,
      series,
    }))
  }, [])

  const handleStartGame = useCallback((series: SeriesState) => {
    setApp(prev => ({ ...prev, screen: 'GAME', series }))
  }, [])

  const handleGameEnd = useCallback((playerWon: boolean) => {
    setApp(prev => {
      if (!prev.series) return prev
      const s = prev.series
      const isHome = s.playerIsHome

      const newSeries: SeriesState = {
        ...s,
        homeWins: s.homeWins + (playerWon === isHome ? 1 : 0),
        awayWins: s.awayWins + (playerWon !== isHome ? 1 : 0),
      }

      const winner = isSeriesOver(newSeries)

      if (!winner) {
        return { ...prev, series: newSeries, screen: 'BRACKET' }
      }

      const playerAdvanced = (winner === 'home' && isHome) || (winner === 'away' && !isHome)
      const newHistory = [
        ...prev.seriesHistory,
        { round: s.round, winner: playerAdvanced ? prev.teams[prev.playerTeamIndex].name : '상대팀', playerWon: playerAdvanced },
      ]

      if (!playerAdvanced) {
        return { ...prev, series: newSeries, seriesHistory: newHistory, screen: 'SERIES_RESULT' }
      }

      if (s.round === 'ks') {
        return { ...prev, series: newSeries, seriesHistory: newHistory, screen: 'CHAMPIONSHIP' }
      }

      const nextRound = getNextRound(s.round)!
      const nextSeries = buildNextSeries(prev.teams, prev.playerTeamIndex, nextRound)
      return { ...prev, series: nextSeries, seriesHistory: newHistory, screen: 'BRACKET' }
    })
  }, [])

  const handleContinue = useCallback(() => {
    if (!savedState) return
    setApp(savedState)
    setSavedState(null)
  }, [savedState])

  const handleRestart = useCallback(() => {
    clearSave()
    setSavedState(null)
    setApp(createInitialState())
  }, [])

  // ── Render ──────────────────────────────────────────────────

  if (app.screen === 'SETUP') {
    const player = savedState?.teams[savedState.playerTeamIndex]
    const kboTeam = KBO_TEAMS.find(t => t.id === savedState?.selectedKBOTeamId)
    const saveInfo = player && savedState ? {
      shortName: player.shortName,
      emoji: kboTeam?.emoji ?? '⚾',
      color: player.color,
      roundLabel: savedState.series ? ROUND_LABELS_SAVE[savedState.series.round] : '포스트시즌',
      screen: savedState.screen,
    } : null
    return <TeamSetupScreen onStart={handleSetupDone} saveInfo={saveInfo} onContinue={saveInfo ? handleContinue : undefined} />
  }

  if (app.screen === 'BRACKET' && app.series) {
    return <BracketScreen appState={app} onStartGame={handleStartGame} />
  }

  if (app.screen === 'GAME' && app.series) {
    return <GameScreen appState={app} series={app.series} onGameEnd={handleGameEnd} />
  }

  if (app.screen === 'SERIES_RESULT') {
    return <EliminatedScreen app={app} onRestart={handleRestart} />
  }

  if (app.screen === 'CHAMPIONSHIP') {
    return <ChampionScreen app={app} onRestart={handleRestart} />
  }

  return null
}

// ─── Result screens ───────────────────────────────────────────────

const ROUND_LABELS: Record<Round, string> = {
  wildcard: '와일드카드', semipo: '준플레이오프', po: '플레이오프', ks: '한국시리즈'
}

function EliminatedScreen({ app, onRestart }: { app: AppState; onRestart: () => void }) {
  const player = app.teams[app.playerTeamIndex]
  const last = app.seriesHistory[app.seriesHistory.length - 1]
  const hex = player ? getTeamColorHex(player.color) : '#888'

  function getTeamColorHex(color: TeamColor): string {
    const map: Record<string, string> = {
      blue:'#3b82f6',red:'#ef4444',green:'#22c55e',purple:'#a855f7',
      orange:'#f97316',yellow:'#eab308',pink:'#ec4899',indigo:'#6366f1',teal:'#14b8a6',rose:'#f43f5e'
    }
    return map[color] ?? '#888'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="text-7xl">😔</div>
      <h1 className="text-3xl font-black text-gray-300">시즌 종료</h1>
      {last && <p className="text-gray-400">{ROUND_LABELS[last.round]}에서 탈락했습니다.</p>}

      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm space-y-2">
        {player && <div className="text-base font-bold text-white mb-3" style={{ color: hex }}>{player.name}</div>}
        {app.seriesHistory.map((h, i) => (
          <div key={i} className={`text-sm flex justify-between px-3 py-1.5 rounded-lg
            ${h.playerWon ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
            <span>{ROUND_LABELS[h.round]}</span>
            <span>{h.playerWon ? '진출 ✓' : '탈락 ✗'}</span>
          </div>
        ))}
      </div>

      <button onClick={onRestart}
        className="w-full max-w-sm py-4 rounded-2xl bg-gray-700 hover:bg-gray-600 font-black text-lg transition-all active:scale-95">
        다시 시작
      </button>
    </div>
  )
}

function ChampionScreen({ app, onRestart }: { app: AppState; onRestart: () => void }) {
  const player = app.teams[app.playerTeamIndex]

  function getTeamColorHex(color: TeamColor): string {
    const map: Record<string, string> = {
      blue:'#3b82f6',red:'#ef4444',green:'#22c55e',purple:'#a855f7',
      orange:'#f97316',yellow:'#eab308',pink:'#ec4899',indigo:'#6366f1',teal:'#14b8a6',rose:'#f43f5e'
    }
    return map[color] ?? '#888'
  }

  const hex = player ? getTeamColorHex(player.color) : '#eab308'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="text-8xl animate-bounce">🏆</div>
      <h1 className="text-4xl font-black text-yellow-400">한국시리즈 우승!</h1>
      {player && <div className="text-2xl font-bold" style={{ color: hex }}>{player.name}</div>}
      <p className="text-gray-400 max-w-xs">
        와일드카드 5위에서 시작해 한국시리즈 정상까지!<br/>역대급 우승입니다!
      </p>
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-5 w-full max-w-sm space-y-1">
        {app.seriesHistory.map((h, i) => (
          <div key={i} className="text-sm text-yellow-300 flex justify-between px-2 py-0.5">
            <span>{ROUND_LABELS[h.round]}</span><span>우승 ✓</span>
          </div>
        ))}
      </div>
      <button onClick={onRestart}
        className="w-full max-w-sm py-5 rounded-2xl font-black text-xl text-gray-900 transition-all active:scale-95 shadow-2xl"
        style={{ backgroundColor: hex }}>
        다시 도전! 🏆
      </button>
    </div>
  )
}

