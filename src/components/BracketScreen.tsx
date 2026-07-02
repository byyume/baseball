'use client'
import type { AppState, SeriesState, Round } from '@/lib/types'
import { getTeamColorHex, getTeamTailwind } from '@/lib/defaultData'

interface Props {
  appState: AppState
  onStartGame: (series: SeriesState) => void
}

const ROUND_INFO: Record<Round, { label: string; subtitle: string; maxWins: number }> = {
  wildcard: { label: '와일드카드', subtitle: '1패 = 탈락 (홈팀 유리)', maxWins: 2 },
  semipo:   { label: '준플레이오프', subtitle: '3선승제', maxWins: 3 },
  po:       { label: '플레이오프', subtitle: '3선승제', maxWins: 3 },
  ks:       { label: '한국시리즈', subtitle: '4선승제', maxWins: 4 },
}

function getNextRound(current: Round): Round | null {
  const order: Round[] = ['wildcard', 'semipo', 'po', 'ks']
  const idx = order.indexOf(current)
  return idx < order.length - 1 ? order[idx + 1] : null
}

export default function BracketScreen({ appState, onStartGame }: Props) {
  const { teams, playerTeamIndex, series, seriesHistory } = appState
  const playerTeam = teams[playerTeamIndex] // index 4 = 5th place

  // Determine current series
  let currentSeries = series
  if (!currentSeries) {
    // Default: Wild Card — player (5th, idx 4) vs 4th place (idx 3)
    currentSeries = {
      round: 'wildcard',
      homeTeam: teams[3], // 4th place is home
      awayTeam: teams[4], // 5th place (player) is away
      homeWins: 0,
      awayWins: 0,
      maxWins: 2,
      playerIsHome: false,
    }
  }

  const roundInfo = ROUND_INFO[currentSeries.round]
  const playerWinning = currentSeries.playerIsHome
    ? currentSeries.homeWins > currentSeries.awayWins
    : currentSeries.awayWins > currentSeries.homeWins
  const opponentTeam = currentSeries.playerIsHome ? currentSeries.awayTeam : currentSeries.homeTeam

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-8 gap-6">
      {/* Title */}
      <div className="text-center">
        <div className="text-xs text-gray-500 tracking-widest uppercase mb-1">KBO 가을야구</div>
        <h1 className="text-3xl font-black tracking-tight">포스트시즌</h1>
        <p className="text-sm text-gray-400 mt-1">목표: 한국시리즈 우승!</p>
      </div>

      {/* Series history */}
      {seriesHistory.length > 0 && (
        <div className="w-full max-w-sm bg-gray-900 rounded-xl p-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">진행 현황</h3>
          {seriesHistory.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              <span className={h.playerWon ? 'text-green-400' : 'text-red-400'}>{h.playerWon ? '✓' : '✗'}</span>
              <span className="text-gray-400">{ROUND_INFO[h.round].label}</span>
              <span className={h.playerWon ? 'text-green-300 font-bold' : 'text-red-300 font-bold'}>
                {h.playerWon ? '승리' : '탈락'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current series */}
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-5 border border-gray-700">
        <div className="text-center mb-4">
          <div className="text-yellow-400 font-black text-xl">{roundInfo.label}</div>
          <div className="text-gray-400 text-sm">{roundInfo.subtitle}</div>
        </div>

        {/* Matchup */}
        <div className="flex items-center justify-between mb-4">
          <TeamCard team={currentSeries.homeTeam} isPlayer={currentSeries.playerIsHome} label="홈" />
          <div className="flex flex-col items-center">
            <div className="text-3xl font-black text-gray-300">
              {currentSeries.homeWins}
              <span className="text-gray-600 mx-1">:</span>
              {currentSeries.awayWins}
            </div>
            {(currentSeries.homeWins > 0 || currentSeries.awayWins > 0) && (
              <div className="text-xs text-gray-500 mt-1">
                {currentSeries.maxWins}승 먼저
              </div>
            )}
          </div>
          <TeamCard team={currentSeries.awayTeam} isPlayer={!currentSeries.playerIsHome} label="원정" />
        </div>

        {/* Wild card note */}
        {currentSeries.round === 'wildcard' && (
          <div className="text-xs text-yellow-600 bg-yellow-900/20 rounded-lg px-3 py-2 text-center mb-4">
            ⚠️ 와일드카드: 홈팀({currentSeries.homeTeam.shortName})은 1승만 필요 / 원정팀은 2연승 필요
          </div>
        )}

        {/* Start button */}
        <button
          onClick={() => onStartGame(currentSeries!)}
          className="w-full py-4 rounded-2xl font-black text-xl text-white
            transition-all active:scale-95 shadow-2xl"
          style={{ backgroundColor: getTeamColorHex(playerTeam.color) }}
        >
          {currentSeries.homeWins === 0 && currentSeries.awayWins === 0
            ? '경기 시작!'
            : `${currentSeries.homeWins + currentSeries.awayWins + 1}차전 시작!`}
        </button>
      </div>

      {/* Bracket overview */}
      <div className="w-full max-w-sm bg-gray-900 rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">전체 대진표</h3>
        <BracketDiagram teams={teams} currentRound={currentSeries.round} history={seriesHistory} playerIdx={playerTeamIndex} />
      </div>
    </div>
  )
}

function TeamCard({ team, isPlayer, label }: { team: any; isPlayer: boolean; label: string }) {
  const hex = getTeamColorHex(team.color)
  return (
    <div className="flex flex-col items-center gap-1 w-24">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-white border-2"
        style={{ backgroundColor: hex + '33', borderColor: hex }}
      >
        {team.shortName[0]}
      </div>
      <div className="text-center">
        <div className={`text-sm font-bold ${isPlayer ? 'text-yellow-300' : 'text-white'}`}>
          {team.shortName}
          {isPlayer && ' ⭐'}
        </div>
        <div className="text-xs text-gray-500">{team.regularSeason.wins}승</div>
      </div>
    </div>
  )
}

function BracketDiagram({ teams, currentRound, history, playerIdx }: {
  teams: any[]; currentRound: Round; history: any[]; playerIdx: number
}) {
  const rounds: Round[] = ['wildcard', 'semipo', 'po', 'ks']
  const matchups = [
    { round: 'wildcard' as Round, teams: [teams[3], teams[4]], label: '와일드카드' },
    { round: 'semipo' as Round, teams: [teams[2], null], label: '준PO' },
    { round: 'po' as Round, teams: [teams[1], null], label: 'PO' },
    { round: 'ks' as Round, teams: [teams[0], null], label: 'KS' },
  ]

  return (
    <div className="space-y-2">
      {matchups.map(({ round, teams: mt, label }) => {
        const pastResult = history.find(h => h.round === round)
        const isCurrent = round === currentRound
        return (
          <div key={round} className={`flex items-center gap-3 text-xs px-2 py-1.5 rounded-lg transition-all
            ${isCurrent ? 'bg-gray-700 border border-gray-500' : 'opacity-60'}`}>
            <span className="text-gray-500 w-16">{label}</span>
            <span className={mt[0]?.id === teams[playerIdx]?.id ? 'text-yellow-300 font-bold' : 'text-gray-300'}>
              {mt[0]?.shortName ?? '?'}
            </span>
            <span className="text-gray-600">vs</span>
            <span className={mt[1]?.id === teams[playerIdx]?.id ? 'text-yellow-300 font-bold' : 'text-gray-300'}>
              {mt[1]?.shortName ?? '와카 우승'}
            </span>
            {pastResult && (
              <span className={`ml-auto font-bold ${pastResult.playerWon ? 'text-green-400' : 'text-red-400'}`}>
                {pastResult.playerWon ? '진출' : '탈락'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
