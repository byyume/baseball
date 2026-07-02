'use client'
import { useState, useCallback, useRef } from 'react'
import type {
  GameState, AppState, BattingCommand, PitchingCommand, RunnerCommand, SeriesState
} from '@/lib/types'
import {
  initGameState, getCurrentBatter, getCurrentPitcher,
  applyPitchResult, startNextHalf, simulateSinglePitch, simulateAtBatFinal,
  generateRandomCount, isGameOver, changePitcher, makeEvent,
} from '@/lib/gameEngine'
import { getTeamColorHex } from '@/lib/defaultData'
import BaseballField from './BaseballField'
import { BattingCommandPanel, PitchingCommandPanel } from './CommandPanel'

interface Props {
  appState: AppState
  series: SeriesState
  onGameEnd: (playerWon: boolean) => void
}

export default function GameScreen({ appState, series, onGameEnd }: Props) {
  const playerTeam = appState.teams[appState.playerTeamIndex]
  const playerHex = getTeamColorHex(playerTeam.color)
  const pitchMode = appState.pitchMode

  const [game, setGame] = useState<GameState>(() => {
    const g = initGameState(series.homeTeam, series.awayTeam, appState.inningMode)
    if (pitchMode === 'final' || pitchMode === 'mid') {
      const { balls, strikes } = generateRandomCount()
      return { ...g, balls, strikes }
    }
    return g
  })
  const [battingCmd, setBattingCmd] = useState<BattingCommand>('SWING')
  const [pitchingCmd, setPitchingCmd] = useState<PitchingCommand>('ATTACK')
  const [runnerCmd, setRunnerCmd] = useState<RunnerCommand>(null)
  const [busy, setBusy] = useState(false)
  const gameRef = useRef(game)
  gameRef.current = game

  const isPlayerBatting = game.isTop
    ? game.awayTeam.id === playerTeam.id
    : game.homeTeam.id === playerTeam.id

  const batter = getCurrentBatter(game)
  const pitcher = getCurrentPitcher(game)

  // ── Shared: handle post-result transition ─────────────────────
  const handlePostResult = useCallback(async (newGame: GameState) => {
    const isBetweenHalf = newGame.phase === 'BETWEEN_HALF'
    const gameOver = newGame.phase === 'GAME_OVER' || isGameOver(newGame)

    if (gameOver) {
      const playerIsAway = newGame.awayTeam.id === playerTeam.id
      const playerWon = playerIsAway
        ? newGame.awayScore > newGame.homeScore
        : newGame.homeScore > newGame.awayScore
      setBusy(false)
      onGameEnd(playerWon)
      return
    }

    if (isBetweenHalf) {
      await sleep(800)
      setGame(g => {
        const next = startNextHalf(g)
        if (pitchMode === 'final' || pitchMode === 'mid') {
          const { balls, strikes } = generateRandomCount()
          return { ...next, balls, strikes }
        }
        return next
      })
    }

    setGame(g => {
      if (g.phase === 'PRE_PITCH') return g
      const next = { ...g, phase: 'PRE_PITCH' as const, lastPitch: null }
      // 'final': always resolves a full at-bat, always generate new count
      // 'mid': only generate new count when at-bat is OVER (not intermediate ball/strike/foul)
      const needsNewCount = pitchMode === 'final' || (pitchMode === 'mid' && g.phase === 'SHOW_AT_BAT')
      if (needsNewCount) {
        const { balls, strikes } = generateRandomCount()
        return { ...next, balls, strikes }
      }
      return next
    })
    setBusy(false)
  }, [pitchMode, playerTeam, onGameEnd])

  // ── Execute one pitch (pitch-by-pitch mode) ───────────────────
  const executePitch = useCallback(async () => {
    if (busy) return
    setBusy(true)

    const g = gameRef.current
    const batting = isPlayerBatting ? battingCmd : 'SWING'
    const pitching = !isPlayerBatting ? pitchingCmd : 'ATTACK'

    const pitchResult = simulateSinglePitch(
      getCurrentBatter(g),
      getCurrentPitcher(g),
      g.balls, g.strikes,
      batting, pitching, g.bases, g.outs, runnerCmd,
    )

    const newGame = applyPitchResult(g, pitchResult)
    setGame(newGame)
    setRunnerCmd(null)

    const isAtBatOver = pitchResult.kind === 'AT_BAT_OVER'
    await sleep(isAtBatOver ? 1600 : 900)
    await handlePostResult(newGame)
  }, [busy, isPlayerBatting, battingCmd, pitchingCmd, runnerCmd, handlePostResult])

  // ── Execute final-pitch at-bat (one-decision mode) ────────────
  const executeFinalPitch = useCallback(async () => {
    if (busy) return
    setBusy(true)

    const g = gameRef.current
    const batting = isPlayerBatting ? battingCmd : 'SWING'
    const pitching = !isPlayerBatting ? pitchingCmd : 'ATTACK'

    const pitchResult = simulateAtBatFinal(
      getCurrentBatter(g),
      getCurrentPitcher(g),
      g.balls, g.strikes,
      batting, pitching, g.bases, g.outs, runnerCmd,
    )

    const newGame = applyPitchResult(g, pitchResult)
    setGame(newGame)
    setRunnerCmd(null)

    await sleep(1600)
    await handlePostResult(newGame)
  }, [busy, isPlayerBatting, battingCmd, pitchingCmd, runnerCmd, handlePostResult])

  const executeCommand = pitchMode === 'final' ? executeFinalPitch : executePitch

  // Auto-trigger when AI is batting (player controls pitching, not batting)
  // Player always has control of both sides in this game

  const roundLabels: Record<string, string> = {
    wildcard: '와일드카드', semipo: '준플레이오프', po: '플레이오프', ks: '한국시리즈'
  }

  const canInteract = !busy && game.phase === 'PRE_PITCH'

  return (
    <div className="bg-gray-950 text-white flex flex-col max-w-lg mx-auto lg:border-x lg:border-gray-800"
      style={{ height: '100dvh' }}>

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-1.5 flex items-center justify-between text-xs flex-shrink-0">
        <span className="text-yellow-400 font-bold">{roundLabels[series.round]}</span>
        <span className="text-gray-400">
          {series.homeTeam.shortName} {series.homeWins}승 - {series.awayWins}승 {series.awayTeam.shortName}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTeamColorHex(playerTeam.color) }} />
          <span className="text-gray-300">{playerTeam.shortName}</span>
        </div>
      </div>

      {/* ── Score & Inning ────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Away */}
          <ScoreTeam
            team={game.awayTeam}
            score={game.awayScore}
            isBatting={game.isTop}
            isPlayer={game.awayTeam.id === playerTeam.id}
          />
          {/* Inning */}
          <div className="text-center">
            <div className="text-xs text-gray-500">{game.inning}회</div>
            <div className="text-2xl font-black text-yellow-400">
              {game.isTop ? '△ 초' : '▽ 말'}
            </div>
            <div className="flex gap-1 justify-center mt-1">
              {[0,1,2].map(i => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full border ${
                  i < game.outs ? 'bg-red-500 border-red-400' : 'border-gray-600'
                }`} />
              ))}
            </div>
          </div>
          {/* Home */}
          <ScoreTeam
            team={game.homeTeam}
            score={game.homeScore}
            isBatting={!game.isTop}
            isPlayer={game.homeTeam.id === playerTeam.id}
          />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col p-2 gap-2 overflow-y-auto">

        {/* Matchup row */}
        <div className="flex items-center justify-between bg-gray-900 rounded-xl px-3 py-2 text-sm flex-shrink-0">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">투수</div>
            <div className="font-bold text-white">{pitcher.name}</div>
            <div className="text-[10px] text-gray-400">ERA {pitcher.era.toFixed(2)}</div>
          </div>
          <div className="text-gray-600 text-xl">⚾</div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 mb-0.5">타자</div>
            <div className="font-bold text-white">{batter.name}</div>
            <div className="text-[10px] text-gray-400">
              AVG .{Math.round(batter.avg * 1000).toString().padStart(3, '0')}
              {' · '}파워 {'★'.repeat(batter.power)}
            </div>
          </div>
        </div>

        {/* ── BALL COUNT — the central element ──────────────────── */}
        <CountBoard
          balls={game.balls}
          strikes={game.strikes}
          outs={game.outs}
          pitchMode={pitchMode}
        />

        {/* Pitch result flash */}
        {game.lastPitch && (
          <PitchResultFlash
            text={game.lastPitch.text}
            kind={game.lastPitch.kind}
            isAtBatOver={game.lastPitch.isAtBatOver}
          />
        )}

        {/* Baseball field */}
        <div className="flex justify-center flex-shrink-0">
          <div className="w-full max-w-[160px]">
            <BaseballField
              bases={game.bases}
              outs={game.outs}
              playerColor={playerTeam.color}
              isPlayerBatting={isPlayerBatting}
            />
          </div>
        </div>

        {/* Event log */}
        <EventLog events={game.events.slice(0, 2)} />
      </div>

      {/* ── Command area (bottom) ────────────────────────────────── */}
      <div className="border-t border-gray-800 bg-gray-950 p-2 flex-shrink-0">
        {game.phase === 'PRE_PITCH' && (
          isPlayerBatting ? (
            <BattingCommandPanel
              bases={game.bases}
              outs={game.outs}
              isDisabled={!canInteract}
              selectedBatting={battingCmd}
              selectedRunner={runnerCmd}
              onBatting={setBattingCmd}
              onRunner={setRunnerCmd}
              onConfirm={executeCommand}
              playerColor={playerTeam.color}
            />
          ) : (
            <PitchingCommandPanel
              selected={pitchingCmd}
              onChange={setPitchingCmd}
              onConfirm={executeCommand}
              onChangePitcher={() => setGame(g => changePitcher(g))}
              isDisabled={!canInteract}
              playerColor={playerTeam.color}
              pitcherName={pitcher.name}
              pitcherEra={pitcher.era}
            />
          )
        )}

        {(game.phase === 'SHOW_PITCH' || game.phase === 'SHOW_AT_BAT') && (
          <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
            {pitchMode === 'final' ? '다음 타자…' : '잠시 후 다음 투구…'}
          </div>
        )}

        {game.phase === 'BETWEEN_HALF' && (
          <div className="text-center py-4">
            <div className="text-yellow-400 font-bold">
              {game.inning}회 {game.isTop ? '초' : '말'} 공격 종료
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {game.awayScore} - {game.homeScore}
            </div>
          </div>
        )}

        {game.phase === 'GAME_OVER' && (
          <div className="text-center py-4">
            <div className="text-2xl font-black text-yellow-400">경기 종료</div>
            <div className="text-base text-white mt-1">
              {game.awayTeam.shortName} {game.awayScore} - {game.homeScore} {game.homeTeam.shortName}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function ScoreTeam({
  team, score, isBatting, isPlayer
}: { team: any; score: number; isBatting: boolean; isPlayer: boolean }) {
  const hex = getTeamColorHex(team.color)
  return (
    <div className={`text-center min-w-[80px] transition-all ${isBatting ? 'opacity-100' : 'opacity-60'}`}>
      <div className={`text-xs font-bold mb-1 ${isPlayer ? 'text-yellow-300' : 'text-gray-300'}`}>
        {team.shortName} {isPlayer ? '⭐' : ''}
      </div>
      <div
        className="text-3xl font-black"
        style={{ color: isBatting ? hex : '#9ca3af' }}
      >
        {score}
      </div>
      {isBatting && (
        <div className="text-[9px] text-gray-400 mt-0.5">공격 중</div>
      )}
    </div>
  )
}

function CountBoard({ balls, strikes, outs, pitchMode }: {
  balls: number; strikes: number; outs: number; pitchMode?: string
}) {
  const modeLabel =
    pitchMode === 'final' ? { text: '⚡ 마지막 투구 상황', cls: 'text-yellow-500' } :
    pitchMode === 'mid'   ? { text: '🎲 중간 카운트부터', cls: 'text-blue-400' } :
    null

  return (
    <div className="bg-gray-900 rounded-2xl px-4 py-3 flex flex-col items-center gap-2 flex-shrink-0">
      {modeLabel && (
        <div className={`text-[10px] uppercase tracking-widest font-bold ${modeLabel.cls}`}>
          {modeLabel.text}
        </div>
      )}
      <div className="flex items-center justify-center gap-6 w-full">
        {/* Balls */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">볼</span>
          <div className="flex gap-1">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < balls
                    ? 'bg-green-500 border-green-400 shadow-green-500/50 shadow-sm'
                    : 'border-gray-600 bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Count text */}
        <div className="text-center">
          <div className="text-3xl font-black font-mono text-white tracking-wider">
            {balls}<span className="text-gray-600">-</span>{strikes}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">볼-스트라이크</div>
        </div>

        {/* Strikes */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">스트라이크</span>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < strikes
                    ? 'bg-red-500 border-red-400 shadow-red-500/50 shadow-sm'
                    : 'border-gray-600 bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PitchResultFlash({ text, kind, isAtBatOver }: {
  text: string; kind: string; isAtBatOver: boolean
}) {
  const colors: Record<string, string> = {
    ball: 'text-green-400', strike: 'text-red-400', foul: 'text-yellow-400',
    hit: 'text-yellow-300', out: 'text-red-400', run: 'text-green-300', steal: 'text-blue-300',
  }
  const bgColors: Record<string, string> = {
    ball: 'bg-green-900/20', strike: 'bg-red-900/20', foul: 'bg-yellow-900/10',
    hit: 'bg-yellow-900/20', out: 'bg-red-900/20', run: 'bg-green-900/30', steal: 'bg-blue-900/20',
  }

  return (
    <div className={`rounded-xl px-4 py-3 text-center animate-bounce-once ${bgColors[kind] ?? 'bg-gray-800'}`}>
      <div className={`font-black ${isAtBatOver ? 'text-2xl' : 'text-xl'} ${colors[kind] ?? 'text-white'}`}>
        {text}
      </div>
    </div>
  )
}

function EventLog({ events }: { events: { id: number; text: string; type: string }[] }) {
  if (events.length === 0) return null
  const typeColors: Record<string, string> = {
    hit: 'text-yellow-300', out: 'text-gray-400', run: 'text-green-400',
    info: 'text-blue-300', steal: 'text-blue-300',
  }
  return (
    <div className="bg-gray-900 rounded-xl px-3 py-2.5 space-y-1.5">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">최근 기록</div>
      {events.map((e, i) => (
        <div key={e.id} className={`text-xs ${typeColors[e.type] ?? 'text-gray-300'} ${i === 0 ? 'font-bold' : 'opacity-50'}`}>
          {e.text}
        </div>
      ))}
    </div>
  )
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
