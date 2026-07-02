// ─── Player & Team ───────────────────────────────────────────────

export type BatterPosition = 'DH' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF'

export interface Batter {
  id: string
  name: string
  position: BatterPosition
  avg: number      // 0.200 ~ 0.360
  power: number    // 1–5 (HR tendency)
  speed: number    // 1–5 (steal/run)
}

export interface Pitcher {
  id: string
  name: string
  era: number      // 1.5 ~ 6.0
  control: number  // 1–5
  stamina: number  // 60–100
  isStarter: boolean
}

export type TeamColor =
  | 'blue' | 'red' | 'green' | 'purple' | 'orange'
  | 'yellow' | 'pink' | 'indigo' | 'teal' | 'rose'

export interface Team {
  id: number
  name: string
  shortName: string
  color: TeamColor
  batters: Batter[]
  pitchers: Pitcher[]
  regularSeason: { wins: number; losses: number; draws: number }
}

// ─── Postseason ───────────────────────────────────────────────────

export type Round = 'wildcard' | 'semipo' | 'po' | 'ks'

export interface SeriesState {
  round: Round
  homeTeam: Team
  awayTeam: Team
  homeWins: number
  awayWins: number
  maxWins: number
  playerIsHome: boolean
}

// ─── In-Game ──────────────────────────────────────────────────────

export interface BaseState {
  first: Batter | null
  second: Batter | null
  third: Batter | null
}

export type AtBatResultType =
  | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'HR'
  | 'WALK' | 'IBB' | 'HBP'
  | 'STRIKEOUT_LOOKING' | 'STRIKEOUT_SWINGING'
  | 'GROUNDOUT' | 'DOUBLE_PLAY'
  | 'FLYOUT' | 'SAC_FLY'
  | 'LINEOUT'
  | 'INFIELD_HIT'
  | 'SAC_BUNT' | 'BUNT_HIT' | 'BUNT_OUT'
  | 'FC'
  | 'SQUEEZE_SUCCESS' | 'SQUEEZE_FAIL'
  | 'STEAL_SUCCESS' | 'CAUGHT_STEALING'

export interface AtBatResult {
  type: AtBatResultType
  text: string
  runnersBefore: BaseState
  runnersAfter: BaseState
  runsScored: number
  outs: number        // outs generated (0, 1, or 2 for DP)
  batterOut: boolean
}

// ─── Commands (per pitch) ─────────────────────────────────────────

export type BattingCommand =
  | 'SWING'         // 풀스윙
  | 'TAKE'          // 봐
  | 'BUNT'          // 희생번트
  | 'SQUEEZE'       // 스퀴즈 (3루 주자 돌격)
  | 'HIT_AND_RUN'   // 히트앤런

export type PitchingCommand =
  | 'ATTACK'        // 정면승부
  | 'CAREFUL'       // 신중하게
  | 'IBB'           // 고의4구

export type RunnerCommand =
  | 'STEAL_FIRST'
  | 'STEAL_SECOND'
  | 'DOUBLE_STEAL'
  | null

// ─── Single Pitch Result ──────────────────────────────────────────

export type PitchKind =
  | 'BALL' | 'CALLED_STRIKE' | 'SWINGING_STRIKE' | 'FOUL'
  | 'AT_BAT_OVER'   // pitch ended the at-bat (hit, out, walk, K)
  | 'STEAL'         // steal attempted this "pitch"

export interface SinglePitchResult {
  kind: PitchKind
  displayText: string
  displayKind: 'ball' | 'strike' | 'foul' | 'hit' | 'out' | 'run' | 'steal'
  atBatResult?: AtBatResult  // only when kind === 'AT_BAT_OVER' or 'STEAL'
  newBalls: number
  newStrikes: number
}

// ─── Game Events ──────────────────────────────────────────────────

export interface GameEvent {
  id: number
  text: string
  type: 'hit' | 'out' | 'run' | 'info' | 'steal'
}

// ─── Inning Mode ─────────────────────────────────────────────────

export type InningMode = 'full' | 'from7' | 'from9'

// ─── Pitch Mode ───────────────────────────────────────────────────

export type PitchMode = 'all' | 'mid' | 'final'
// 'all'   : pitch-by-pitch from 0-0 — player commands every single pitch
// 'mid'   : random count generated, then pitch-by-pitch from there until at-bat ends
// 'final' : random count shown, player makes ONE call and at-bat resolves immediately

// ─── Full Game State ──────────────────────────────────────────────

export type GamePhase =
  | 'PRE_PITCH'       // waiting for command
  | 'SHOW_PITCH'      // briefly show pitch result (ball/strike/foul)
  | 'SHOW_AT_BAT'     // briefly show at-bat result (hit/out)
  | 'BETWEEN_HALF'    // inning change
  | 'GAME_OVER'

export interface LineupState {
  batterIndex: number
  pitcherIndex: number
}

export interface LastPitchDisplay {
  text: string
  kind: 'ball' | 'strike' | 'foul' | 'hit' | 'out' | 'run' | 'steal'
  isAtBatOver: boolean
  atBatResult?: AtBatResult
}

export interface GameState {
  phase: GamePhase
  inning: number
  isTop: boolean
  outs: number
  balls: number
  strikes: number
  bases: BaseState
  homeScore: number
  awayScore: number
  homeTeam: Team
  awayTeam: Team
  homeLineup: LineupState
  awayLineup: LineupState
  events: GameEvent[]
  lastPitch: LastPitchDisplay | null
  inningMode: InningMode
}

// ─── App-level State ──────────────────────────────────────────────

export type AppScreen =
  | 'SETUP'           // combined: team select + inning mode
  | 'BRACKET'
  | 'GAME'
  | 'SERIES_RESULT'
  | 'CHAMPIONSHIP'

export interface AppState {
  screen: AppScreen
  teams: Team[]
  playerTeamIndex: number
  series: SeriesState | null
  seriesHistory: { round: Round; winner: string; playerWon: boolean }[]
  inningMode: InningMode
  pitchMode: PitchMode
  selectedKBOTeamId: number | null
}
