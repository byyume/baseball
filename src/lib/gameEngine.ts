import type {
  Batter, Pitcher, Team, BaseState, GameState, LineupState,
  AtBatResult, AtBatResultType, BattingCommand, PitchingCommand,
  RunnerCommand, GameEvent, GamePhase, SinglePitchResult, InningMode,
  PitchMode,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────

let _eid = 0
export function makeEvent(text: string, type: GameEvent['type'] = 'info'): GameEvent {
  return { id: ++_eid, text, type }
}

function rand(): number { return Math.random() }
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)) }

// ─── Zone probability by count ────────────────────────────────────

const IN_ZONE: Record<string, number> = {
  '0-0': 0.58, '1-0': 0.52, '0-1': 0.63, '2-0': 0.46,
  '1-1': 0.60, '0-2': 0.68, '3-0': 0.42, '2-1': 0.56,
  '1-2': 0.70, '3-1': 0.50, '2-2': 0.64, '3-2': 0.60,
}

// ─── Runner Advancement ───────────────────────────────────────────

function advanceRunners(
  before: BaseState,
  type: AtBatResultType,
  batter: Batter,
  outs: number,
): { bases: BaseState; runsScored: number; runDesc: string[] } {
  let { first, second, third } = before
  let runs = 0
  const desc: string[] = []

  switch (type) {
    case 'SINGLE':
    case 'INFIELD_HIT':
    case 'BUNT_HIT': {
      if (third) { runs++; desc.push(`${third.name} 홈인!`); third = null }
      if (second) {
        if (batter.speed >= 4 || rand() < 0.55) { runs++; desc.push(`${second.name} 홈인!`); second = null }
        else { desc.push(`${second.name} 3루 진루`); third = second; second = null }
      }
      if (first) { desc.push(`${first.name} 2루 진루`); second = first; first = null }
      first = batter; break
    }
    case 'DOUBLE': {
      if (third) { runs++; desc.push(`${third.name} 홈인!`); third = null }
      if (second) { runs++; desc.push(`${second.name} 홈인!`); second = null }
      if (first) {
        if (rand() < 0.65) { runs++; desc.push(`${first.name} 홈인!`); first = null }
        else { desc.push(`${first.name} 3루 진루`); third = first; first = null }
      }
      second = batter; break
    }
    case 'TRIPLE': {
      if (third) { runs++; desc.push(`${third.name} 홈인!`); }
      if (second) { runs++; desc.push(`${second.name} 홈인!`); }
      if (first) { runs++; desc.push(`${first.name} 홈인!`); }
      first = null; second = null; third = batter; break
    }
    case 'HR': {
      if (third) { runs++; desc.push(`${third.name} 홈인!`); }
      if (second) { runs++; desc.push(`${second.name} 홈인!`); }
      if (first) { runs++; desc.push(`${first.name} 홈인!`); }
      runs++; desc.push(`${batter.name} 홈인!`)
      first = null; second = null; third = null; break
    }
    case 'WALK': case 'IBB': case 'HBP': {
      if (first && second && third) { runs++; desc.push(`${third.name} 밀려서 홈인!`) }
      else if (first && second) { desc.push(`${second.name} 3루 진루`) }
      else if (first) { desc.push(`${first.name} 2루 진루`) }
      if (first && second) { third = second }
      if (first) { second = first }
      first = batter; break
    }
    case 'GROUNDOUT': {
      if (third && outs < 2) { runs++; desc.push(`${third.name} 홈인!`); third = null }
      if (second) { desc.push(`${second.name} 3루 진루`); third = second; second = null }
      if (first) { desc.push(`${first.name} 2루 진루`); second = first; first = null }
      break
    }
    case 'DOUBLE_PLAY': {
      if (second) { desc.push(`${second.name} 3루 진루`); third = second; second = null }
      if (first) first = null; break
    }
    case 'FLYOUT': {
      // Runner on 2nd can tag up to 3rd on a deep fly
      if (second && !third && outs < 2 && rand() < 0.32 + (second.speed - 3) * 0.06) {
        desc.push(`${second.name} 태그업 3루 진루`)
        third = second; second = null
      }
      break
    }
    case 'LINEOUT': break
    case 'SAC_FLY': {
      if (third) { runs++; desc.push(`${third.name} 태그업 홈인!`); third = null }
      // Runner on 2nd may also advance on a sac fly
      if (second && !third && outs < 2 && rand() < 0.45) {
        desc.push(`${second.name} 3루 진루`)
        third = second; second = null
      }
      break
    }
    case 'SAC_BUNT': {
      if (third && outs === 0) { runs++; desc.push(`${third.name} 홈인!`); third = null }
      else if (second) { desc.push(`${second.name} 3루 진루`); third = second; second = null }
      else if (first) { desc.push(`${first.name} 2루 진루`); second = first; first = null }
      break
    }
    case 'FC': {
      if (first) { desc.push(`${first.name} 2루 진루 (야수선택)`); second = first }
      first = batter; break
    }
    case 'SQUEEZE_SUCCESS': {
      if (third) { runs++; desc.push(`${third.name} 스퀴즈 홈인!`); third = null }
      break
    }
    default: break
  }
  return { bases: { first, second, third }, runsScored: runs, runDesc: desc }
}

// ─── At-bat fair contact resolution ──────────────────────────────

function resolveFairContact(batter: Batter, pitcher: Pitcher, bases: BaseState, outs: number): AtBatResult {
  const r = rand()
  const hitProb = clamp(batter.avg + (batter.power - 3) * 0.015 - (pitcher.era - 4) * 0.01, 0.18, 0.42)
  const hrBonus = (batter.power - 3) * 0.012

  let type: AtBatResultType
  if (r < hrBonus + 0.04)         type = 'HR'
  else if (r < hrBonus + 0.06)    type = 'TRIPLE'
  else if (r < hrBonus + 0.16)    type = 'DOUBLE'
  else if (r < hrBonus + hitProb) type = rand() < 0.12 ? 'INFIELD_HIT' : 'SINGLE'
  else {
    const outRoll = rand()
    if (outRoll < 0.38) type = 'GROUNDOUT'
    else if (outRoll < 0.70) type = 'FLYOUT'
    else if (outRoll < 0.85) type = 'LINEOUT'
    else if (outRoll < 0.92) type = (bases.first || bases.second || bases.third) ? 'FC' : 'GROUNDOUT'
    else type = 'GROUNDOUT'
  }

  // Double play check
  if (type === 'GROUNDOUT' && outs < 2 && bases.first && rand() < 0.40) {
    type = 'DOUBLE_PLAY'
  }
  // Sac fly check
  if (type === 'FLYOUT' && outs < 2 && bases.third && rand() < 0.65) {
    type = 'SAC_FLY'
  }

  const batterOut = isBatterOut(type)
  const outsGen = type === 'DOUBLE_PLAY' ? 2 : batterOut ? 1 : 0
  const adv = advanceRunners(bases, type, batter, outs)

  return {
    type,
    text: getAtBatText(type, batter) + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''),
    runnersBefore: bases,
    runnersAfter: adv.bases,
    runsScored: adv.runsScored,
    outs: outsGen,
    batterOut,
  }
}

function resolveWalk(type: 'WALK' | 'IBB' | 'HBP', batter: Batter, bases: BaseState): AtBatResult {
  const adv = advanceRunners(bases, type, batter, 0)
  const labels = { WALK: '볼넷', IBB: '고의사구', HBP: '사구 (몸에 맞는 볼)' }
  return {
    type, text: `${batter.name} ${labels[type]}` + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''),
    runnersBefore: bases, runnersAfter: adv.bases,
    runsScored: adv.runsScored, outs: 0, batterOut: false,
  }
}

function resolveStrikeout(batter: Batter, swinging: boolean): AtBatResult {
  const type: AtBatResultType = swinging ? 'STRIKEOUT_SWINGING' : 'STRIKEOUT_LOOKING'
  return {
    type, text: `${batter.name} ${swinging ? '헛스윙' : '루킹'} 삼진!`,
    runnersBefore: { first: null, second: null, third: null },
    runnersAfter: { first: null, second: null, third: null },
    runsScored: 0, outs: 1, batterOut: true,
  }
}

// ─── Main Pitch Simulation ────────────────────────────────────────

export function simulateSinglePitch(
  batter: Batter,
  pitcher: Pitcher,
  balls: number,
  strikes: number,
  battingCmd: BattingCommand,
  pitchingCmd: PitchingCommand,
  bases: BaseState,
  outs: number,
  runnerCmd: RunnerCommand,
): SinglePitchResult {

  // ── Steal attempt (happens before pitch) ─────────────────────
  if (runnerCmd === 'STEAL_FIRST' || runnerCmd === 'STEAL_SECOND' || runnerCmd === 'DOUBLE_STEAL') {
    return doSteal(batter, bases, outs, runnerCmd, balls, strikes)
  }

  // ── IBB ───────────────────────────────────────────────────────
  if (pitchingCmd === 'IBB') {
    const newBalls = balls + 1
    if (newBalls >= 4) {
      const res = resolveWalk('IBB', batter, bases)
      return { kind: 'AT_BAT_OVER', displayText: '고의사구 — 볼넷', displayKind: 'hit', atBatResult: res, newBalls: newBalls, newStrikes: strikes }
    }
    return { kind: 'BALL', displayText: `고의사구 볼! (${newBalls}-${strikes})`, displayKind: 'ball', newBalls, newStrikes: strikes }
  }

  // ── Determine zone ────────────────────────────────────────────
  let inZoneProb = IN_ZONE[`${balls}-${strikes}`] ?? 0.58
  if (pitchingCmd === 'ATTACK')  inZoneProb += 0.07
  if (pitchingCmd === 'CAREFUL') inZoneProb -= 0.07
  inZoneProb = clamp(inZoneProb + (pitcher.control - 3) * 0.025, 0.28, 0.88)
  const inZone = rand() < inZoneProb

  // ── TAKE ──────────────────────────────────────────────────────
  if (battingCmd === 'TAKE') {
    if (inZone) {
      const ns = strikes + 1
      if (ns >= 3) {
        const res = resolveStrikeout(batter, false)
        res.runnersBefore = bases; res.runnersAfter = bases
        return { kind: 'AT_BAT_OVER', displayText: '루킹 삼진!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: ns }
      }
      return { kind: 'CALLED_STRIKE', displayText: `스트라이크! (${balls}-${ns})`, displayKind: 'strike', newBalls: balls, newStrikes: ns }
    } else {
      const nb = balls + 1
      if (nb >= 4) {
        const res = resolveWalk('WALK', batter, bases)
        return { kind: 'AT_BAT_OVER', displayText: '볼넷!', displayKind: 'hit', atBatResult: res, newBalls: nb, newStrikes: strikes }
      }
      return { kind: 'BALL', displayText: `볼! (${nb}-${strikes})`, displayKind: 'ball', newBalls: nb, newStrikes: strikes }
    }
  }

  // ── SQUEEZE ───────────────────────────────────────────────────
  if (battingCmd === 'SQUEEZE') {
    if (!bases.third) {
      // No runner on 3rd — treat as normal bunt
      return handleBuntPitch(batter, pitcher, balls, strikes, bases, outs, false)
    }
    const r = rand()
    if (r < 0.15) {
      // Foul / miss on squeeze → runner out (fail)
      const res: AtBatResult = {
        type: 'SQUEEZE_FAIL',
        text: `${batter.name} 스퀴즈 실패! ${bases.third.name} 아웃`,
        runnersBefore: bases,
        runnersAfter: { ...bases, third: null },
        runsScored: 0, outs: 1, batterOut: false,
      }
      return { kind: 'AT_BAT_OVER', displayText: '스퀴즈 실패!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: strikes }
    }
    if (r < 0.35) {
      // Out on bunt
      const adv = advanceRunners(bases, 'SAC_BUNT', batter, outs)
      const res: AtBatResult = {
        type: 'SAC_BUNT',
        text: `${batter.name} 희생번트` + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''),
        runnersBefore: bases, runnersAfter: adv.bases,
        runsScored: adv.runsScored, outs: 1, batterOut: true,
      }
      return { kind: 'AT_BAT_OVER', displayText: `희생번트! ${adv.runsScored > 0 ? '득점!' : ''}`, displayKind: adv.runsScored > 0 ? 'run' : 'out', atBatResult: res, newBalls: balls, newStrikes: strikes }
    }
    // Success
    const adv = advanceRunners(bases, 'SQUEEZE_SUCCESS', batter, outs)
    const res: AtBatResult = {
      type: 'SQUEEZE_SUCCESS',
      text: `${batter.name} 스퀴즈 성공! · ${adv.runDesc.join(' ')}`,
      runnersBefore: bases, runnersAfter: adv.bases,
      runsScored: adv.runsScored, outs: 1, batterOut: true,
    }
    return { kind: 'AT_BAT_OVER', displayText: '스퀴즈 성공! 득점!', displayKind: 'run', atBatResult: res, newBalls: balls, newStrikes: strikes }
  }

  // ── BUNT ──────────────────────────────────────────────────────
  if (battingCmd === 'BUNT') {
    return handleBuntPitch(batter, pitcher, balls, strikes, bases, outs, false)
  }

  // ── SWING / HIT_AND_RUN ───────────────────────────────────────
  const isHNR = battingCmd === 'HIT_AND_RUN'

  // Contact probability
  let contactProb = inZone ? 0.78 : 0.30
  contactProb += (batter.avg - 0.260) * 0.5
  const missProb = 1 - contactProb

  const r = rand()
  if (r < missProb) {
    // Miss → swinging strike
    const ns = strikes + 1
    if (ns >= 3) {
      const res = resolveStrikeout(batter, true)
      res.runnersBefore = bases; res.runnersAfter = bases
      // HNR fail: runner caught stealing if miss
      if (isHNR && bases.first) {
        const caught = rand() < 0.60
        if (caught) {
          res.text += ` (히트앤런 실패, ${bases.first.name} 아웃)`
          res.outs = 2
          res.runnersAfter = { ...bases, first: null }
        }
      }
      return { kind: 'AT_BAT_OVER', displayText: '헛스윙 삼진!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: ns }
    }
    const text = isHNR ? `헛스윙! (${balls}-${ns}) ─ 주자 달리는 중` : `헛스윙! (${balls}-${ns})`
    return { kind: 'SWINGING_STRIKE', displayText: text, displayKind: 'strike', newBalls: balls, newStrikes: ns }
  }

  // Contact — foul or fair
  const foulChance = inZone ? 0.28 : 0.55
  if (rand() < foulChance) {
    // Foul ball
    const ns = Math.min(strikes + 1, 2)
    return { kind: 'FOUL', displayText: `파울! (${balls}-${ns})`, displayKind: 'foul', newBalls: balls, newStrikes: ns }
  }

  // Fair contact — resolve at-bat
  let res = resolveFairContact(batter, pitcher, bases, outs)
  // HNR: runner gets extra advancement
  if (isHNR && bases.first && !res.batterOut) {
    // Runner already factored in advancement, just note the H&R context
    res = { ...res, text: '[히트앤런] ' + res.text }
  }

  const dispKind = res.runsScored > 0 ? 'run'
    : res.batterOut ? 'out'
    : ['SINGLE','DOUBLE','TRIPLE','HR','INFIELD_HIT','BUNT_HIT'].includes(res.type) ? 'hit'
    : 'out'
  return { kind: 'AT_BAT_OVER', displayText: getBigResultText(res.type, batter), displayKind: dispKind, atBatResult: res, newBalls: balls, newStrikes: strikes }
}

// ─── Bunt pitch handler ───────────────────────────────────────────

function handleBuntPitch(
  batter: Batter, pitcher: Pitcher,
  balls: number, strikes: number,
  bases: BaseState, outs: number, squeeze: boolean,
): SinglePitchResult {
  const r = rand()
  const speed = batter.speed

  if (r < 0.08) {
    // Pop out — bunt right to fielder
    const res: AtBatResult = {
      type: 'BUNT_OUT', text: `${batter.name} 번트 팝업 아웃`,
      runnersBefore: bases, runnersAfter: bases,
      runsScored: 0, outs: 1, batterOut: true,
    }
    return { kind: 'AT_BAT_OVER', displayText: '번트 팝업 아웃!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: strikes }
  }
  if (r < 0.15) {
    // Foul bunt
    const ns = Math.min(strikes + 1, 2)
    if (strikes >= 2) {
      // Foul on 2 strikes = out
      const res: AtBatResult = {
        type: 'BUNT_OUT', text: `${batter.name} 번트 파울 아웃 (2스트라이크)`,
        runnersBefore: bases, runnersAfter: bases,
        runsScored: 0, outs: 1, batterOut: true,
      }
      return { kind: 'AT_BAT_OVER', displayText: '번트 파울 아웃!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: ns }
    }
    return { kind: 'FOUL', displayText: `번트 파울! (${balls}-${ns})`, displayKind: 'foul', newBalls: balls, newStrikes: ns }
  }
  if (r < 0.18 + speed * 0.04) {
    // Bunt hit
    const adv = advanceRunners(bases, 'BUNT_HIT', batter, outs)
    const res: AtBatResult = {
      type: 'BUNT_HIT', text: `${batter.name} 번트 안타!` + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''),
      runnersBefore: bases, runnersAfter: adv.bases,
      runsScored: adv.runsScored, outs: 0, batterOut: false,
    }
    return { kind: 'AT_BAT_OVER', displayText: '번트 안타!', displayKind: 'hit', atBatResult: res, newBalls: balls, newStrikes: strikes }
  }
  // Sacrifice bunt success
  const adv = advanceRunners(bases, 'SAC_BUNT', batter, outs)
  const res: AtBatResult = {
    type: 'SAC_BUNT', text: `${batter.name} 희생번트 성공` + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''),
    runnersBefore: bases, runnersAfter: adv.bases,
    runsScored: adv.runsScored, outs: 1, batterOut: true,
  }
  return {
    kind: 'AT_BAT_OVER',
    displayText: adv.runsScored > 0 ? '희생번트 · 득점!' : '희생번트 성공',
    displayKind: adv.runsScored > 0 ? 'run' : 'out',
    atBatResult: res, newBalls: balls, newStrikes: strikes,
  }
}

// ─── Steal ────────────────────────────────────────────────────────

function doSteal(
  batter: Batter, bases: BaseState, outs: number,
  runnerCmd: Exclude<RunnerCommand, null>,
  balls: number, strikes: number,
): SinglePitchResult {
  const newBases = { ...bases }
  let text = ''
  let outsGen = 0

  if (runnerCmd === 'STEAL_FIRST') {
    const runner = bases.first
    if (!runner) return { kind: 'BALL', displayText: '1루 주자 없음', displayKind: 'ball', newBalls: balls, newStrikes: strikes }
    const ok = rand() < clamp(0.55 + (runner.speed - 3) * 0.07, 0.25, 0.85)
    if (ok) { newBases.first = null; newBases.second = runner; text = `${runner.name} 도루 성공! 2루` }
    else { newBases.first = null; outsGen = 1; text = `${runner.name} 도루 실패 아웃!` }
  } else if (runnerCmd === 'STEAL_SECOND') {
    const runner = bases.second
    if (!runner) return { kind: 'BALL', displayText: '2루 주자 없음', displayKind: 'ball', newBalls: balls, newStrikes: strikes }
    const ok = rand() < clamp(0.48 + (runner.speed - 3) * 0.07, 0.20, 0.80)
    if (ok) { newBases.second = null; newBases.third = runner; text = `${runner.name} 도루 성공! 3루` }
    else { newBases.second = null; outsGen = 1; text = `${runner.name} 도루 실패 아웃!` }
  } else {
    // Double steal
    const r1 = bases.first; const r2 = bases.second
    const ok1 = r1 ? rand() < clamp(0.52 + (r1.speed - 3) * 0.06, 0.20, 0.82) : null
    const ok2 = r2 ? rand() < clamp(0.45 + (r2.speed - 3) * 0.06, 0.18, 0.78) : null
    const parts: string[] = []
    if (r1) { if (ok1) { newBases.first = null; newBases.second = r1; parts.push(`${r1.name} 2루 성공`) } else { newBases.first = null; outsGen++; parts.push(`${r1.name} 아웃`) } }
    if (r2) { if (ok2) { newBases.second = null; newBases.third = r2; parts.push(`${r2.name} 3루 성공`) } else { newBases.second = null; outsGen++; parts.push(`${r2.name} 아웃`) } }
    text = '더블스틸: ' + parts.join(', ')
  }

  const stealType = outsGen > 0 ? 'CAUGHT_STEALING' : 'STEAL_SUCCESS'
  const res: AtBatResult = {
    type: stealType, text,
    runnersBefore: bases, runnersAfter: newBases,
    runsScored: 0, outs: outsGen, batterOut: false,
  }
  return {
    kind: 'STEAL',
    displayText: text,
    displayKind: outsGen > 0 ? 'out' : 'steal',
    atBatResult: res,
    newBalls: balls, newStrikes: strikes,
  }
}

// ─── Text helpers ─────────────────────────────────────────────────

function isBatterOut(type: AtBatResultType): boolean {
  return ['STRIKEOUT_LOOKING','STRIKEOUT_SWINGING','GROUNDOUT','DOUBLE_PLAY',
    'FLYOUT','SAC_FLY','LINEOUT','BUNT_OUT','SQUEEZE_FAIL','FC','SAC_BUNT'].includes(type)
}

function getAtBatText(type: AtBatResultType, batter: Batter): string {
  const n = batter.name
  const map: Partial<Record<AtBatResultType, string>> = {
    SINGLE: `${n} 안타!`, DOUBLE: `${n} 2루타!`, TRIPLE: `${n} 3루타!!`, HR: `${n} 홈런!!!`,
    WALK: `${n} 볼넷`, IBB: `${n} 고의사구`, HBP: `${n} 사구`,
    STRIKEOUT_LOOKING: `${n} 루킹 삼진`, STRIKEOUT_SWINGING: `${n} 헛스윙 삼진`,
    GROUNDOUT: `${n} 땅볼 아웃`, DOUBLE_PLAY: `${n} 병살타! DP`,
    FLYOUT: `${n} 뜬공 아웃`, SAC_FLY: `${n} 희생 플라이`,
    LINEOUT: `${n} 라이너 아웃`, INFIELD_HIT: `${n} 내야 안타!`,
    SAC_BUNT: `${n} 희생번트`, BUNT_HIT: `${n} 번트 안타!`, BUNT_OUT: `${n} 번트 아웃`,
    FC: `${n} 야수선택`, SQUEEZE_SUCCESS: `${n} 스퀴즈 성공!`, SQUEEZE_FAIL: `${n} 스퀴즈 실패`,
  }
  return map[type] ?? type
}

function getBigResultText(type: AtBatResultType, batter: Batter): string {
  const n = batter.name
  if (type === 'HR') return `${n} 홈런!!!`
  if (type === 'TRIPLE') return `${n} 3루타!!`
  if (type === 'DOUBLE') return `${n} 2루타!`
  if (['SINGLE','INFIELD_HIT','BUNT_HIT'].includes(type)) return `${n} 안타!`
  if (type === 'DOUBLE_PLAY') return '병살! 더블플레이'
  if (type === 'SAC_FLY') return '희생 플라이'
  if (type === 'SAC_BUNT') return '희생번트'
  if (['STRIKEOUT_LOOKING','STRIKEOUT_SWINGING'].includes(type)) return `${n} 삼진 아웃`
  if (type === 'WALK') return `${n} 볼넷`
  return getAtBatText(type, batter)
}

// ─── Game State Machine ───────────────────────────────────────────

export function initGameState(
  homeTeam: Team,
  awayTeam: Team,
  inningMode: InningMode,
): GameState {
  const base: GameState = {
    phase: 'PRE_PITCH',
    inning: 1,
    isTop: true,
    outs: 0, balls: 0, strikes: 0,
    bases: { first: null, second: null, third: null },
    homeScore: 0, awayScore: 0,
    homeTeam, awayTeam,
    homeLineup: { batterIndex: 0, pitcherIndex: 0 },
    awayLineup: { batterIndex: 0, pitcherIndex: 0 },
    events: [],
    lastPitch: null,
    inningMode,
  }
  if (inningMode === 'full') return base
  return applyInningStart(base, inningMode === 'from7' ? 7 : 9)
}

function applyInningStart(state: GameState, startInning: number): GameState {
  // Random scores: weighted toward lower, close scores
  function randScore(): number {
    const base = Math.floor(rand() * rand() * 10)
    return base
  }
  const awayScore = randScore()
  const homeScore = randScore()
  // Random batting order position
  const awayBatterIdx = Math.floor(rand() * 9)
  const homeBatterIdx = Math.floor(rand() * 9)
  // Relief pitcher (not starter)
  const reliefIdx = (state: GameState) => {
    const pitchers = state.homeTeam.pitchers
    const reliefStart = 5
    return reliefStart + Math.floor(rand() * 4)
  }

  return {
    ...state,
    inning: startInning,
    isTop: true,
    awayScore,
    homeScore,
    awayLineup: { batterIndex: awayBatterIdx, pitcherIndex: 5 + Math.floor(rand() * 4) },
    homeLineup: { batterIndex: homeBatterIdx, pitcherIndex: 5 + Math.floor(rand() * 4) },
  }
}

export function getCurrentBatter(state: GameState): Batter {
  const team = state.isTop ? state.awayTeam : state.homeTeam
  const lineup = state.isTop ? state.awayLineup : state.homeLineup
  return team.batters[lineup.batterIndex % 9]
}

export function getCurrentPitcher(state: GameState): Pitcher {
  const team = state.isTop ? state.homeTeam : state.awayTeam
  const lineup = state.isTop ? state.homeLineup : state.awayLineup
  return team.pitchers[Math.min(lineup.pitcherIndex, team.pitchers.length - 1)]
}

export function applyPitchResult(state: GameState, pitch: SinglePitchResult): GameState {
  let next = { ...state }
  next.balls = pitch.newBalls
  next.strikes = pitch.newStrikes
  next.lastPitch = {
    text: pitch.displayText,
    kind: pitch.displayKind,
    isAtBatOver: pitch.kind === 'AT_BAT_OVER' || pitch.kind === 'STEAL',
    atBatResult: pitch.atBatResult,
  }

  if (pitch.kind === 'BALL') {
    next.phase = 'SHOW_PITCH'
    return next
  }
  if (pitch.kind === 'CALLED_STRIKE' || pitch.kind === 'SWINGING_STRIKE' || pitch.kind === 'FOUL') {
    next.phase = 'SHOW_PITCH'
    return next
  }

  // AT_BAT_OVER or STEAL
  const res = pitch.atBatResult!
  next.bases = res.runnersAfter
  next.outs += res.outs
  if (!res.batterOut && pitch.kind !== 'STEAL') {
    // Batter advanced — advance lineup
    if (state.isTop) next.awayLineup = { ...state.awayLineup, batterIndex: (state.awayLineup.batterIndex + 1) % 9 }
    else next.homeLineup = { ...state.homeLineup, batterIndex: (state.homeLineup.batterIndex + 1) % 9 }
  }
  if (res.batterOut && pitch.kind !== 'STEAL') {
    if (state.isTop) next.awayLineup = { ...state.awayLineup, batterIndex: (state.awayLineup.batterIndex + 1) % 9 }
    else next.homeLineup = { ...state.homeLineup, batterIndex: (state.homeLineup.batterIndex + 1) % 9 }
  }

  // Score
  if (state.isTop) next.awayScore += res.runsScored
  else next.homeScore += res.runsScored

  // Log
  const evType: GameEvent['type'] = res.runsScored > 0 ? 'run'
    : res.batterOut ? 'out'
    : ['SINGLE','DOUBLE','TRIPLE','HR','INFIELD_HIT','BUNT_HIT'].includes(res.type) ? 'hit'
    : pitch.kind === 'STEAL' ? 'steal'
    : 'info'
  next.events = [makeEvent(res.text, evType), ...next.events].slice(0, 30)

  // Reset count for next batter (only when at-bat actually ends)
  if (pitch.kind === 'AT_BAT_OVER') {
    next.balls = 0
    next.strikes = 0
  }

  next.phase = pitch.kind === 'STEAL' ? 'SHOW_PITCH' : 'SHOW_AT_BAT'

  if (next.outs >= 3) next.phase = 'BETWEEN_HALF'
  return checkGameOver(next)
}

export function startNextHalf(state: GameState): GameState {
  let next = { ...state }
  if (state.isTop) { next.isTop = false }
  else { next.inning += 1; next.isTop = true }
  next.outs = 0; next.balls = 0; next.strikes = 0
  next.bases = { first: null, second: null, third: null }
  next.phase = 'PRE_PITCH'; next.lastPitch = null
  return next
}

function checkGameOver(state: GameState): GameState {
  const { inning, isTop, homeScore, awayScore, outs } = state
  if (inning < 9) return state
  if (!isTop && homeScore > awayScore) return { ...state, phase: 'GAME_OVER' }
  if (!isTop && outs >= 3 && homeScore !== awayScore) return { ...state, phase: 'GAME_OVER' }
  return state
}

export function isGameOver(state: GameState): boolean {
  if (state.phase === 'GAME_OVER') return true
  const { inning, isTop, homeScore, awayScore, outs } = state
  if (inning < 9) return false
  if (!isTop && homeScore > awayScore) return true
  if (!isTop && outs >= 3 && homeScore !== awayScore) return true
  return false
}

export function changePitcher(state: GameState): GameState {
  const homePitching = state.isTop
  const lineup = homePitching ? { ...state.homeLineup } : { ...state.awayLineup }
  const team = homePitching ? state.homeTeam : state.awayTeam
  const nextIdx = Math.min(lineup.pitcherIndex + 1, team.pitchers.length - 1)
  const newLineup = { ...lineup, pitcherIndex: nextIdx }
  const newPitcher = team.pitchers[nextIdx]
  const event = makeEvent(`투수 교체 → ${newPitcher.name} 등판 (ERA ${newPitcher.era.toFixed(2)})`, 'info')
  if (homePitching) return { ...state, homeLineup: newLineup, events: [event, ...state.events].slice(0, 30) }
  else return { ...state, awayLineup: newLineup, events: [event, ...state.events].slice(0, 30) }
}

// ─── Final-pitch mode helpers ─────────────────────────────────────

// Weighted random count for "마지막 투구" mode — favors interesting situations
export function generateRandomCount(): { balls: number; strikes: number } {
  const WEIGHTS = [
    { balls: 3, strikes: 2, w: 15 },
    { balls: 2, strikes: 1, w: 13 },
    { balls: 1, strikes: 2, w: 13 },
    { balls: 3, strikes: 1, w: 10 },
    { balls: 2, strikes: 2, w: 10 },
    { balls: 0, strikes: 2, w: 8 },
    { balls: 1, strikes: 1, w: 8 },
    { balls: 0, strikes: 1, w: 7 },
    { balls: 2, strikes: 0, w: 5 },
    { balls: 1, strikes: 0, w: 5 },
    { balls: 3, strikes: 0, w: 4 },
    { balls: 0, strikes: 0, w: 2 },
  ]
  const total = WEIGHTS.reduce((s, c) => s + c.w, 0)
  let r = rand() * total
  for (const { balls, strikes, w } of WEIGHTS) {
    r -= w
    if (r <= 0) return { balls, strikes }
  }
  return { balls: 3, strikes: 2 }
}

// Count advantage: +3 = strong hitter's count, -3 = strong pitcher's count
function getCountAdv(balls: number, strikes: number): number {
  const table: Record<string, number> = {
    '3-0': 3, '3-1': 2, '2-0': 2, '3-2': 0, '2-1': 1,
    '1-0': 0.5, '1-1': 0, '0-0': -0.5, '0-1': -1,
    '1-2': -2, '2-2': -1, '0-2': -3,
  }
  return table[`${balls}-${strikes}`] ?? 0
}

// Simulate the FINAL pitch of an at-bat — always resolves immediately (no intermediate ball/strike)
export function simulateAtBatFinal(
  batter: Batter,
  pitcher: Pitcher,
  balls: number,
  strikes: number,
  batting: BattingCommand,
  pitching: PitchingCommand,
  bases: BaseState,
  outs: number,
  runnerCmd: RunnerCommand,
): SinglePitchResult {
  // Steal (same as pitch-by-pitch)
  if (runnerCmd === 'STEAL_FIRST' || runnerCmd === 'STEAL_SECOND' || runnerCmd === 'DOUBLE_STEAL') {
    return doSteal(batter, bases, outs, runnerCmd, balls, strikes)
  }

  // IBB
  if (pitching === 'IBB') {
    const res = resolveWalk('IBB', batter, bases)
    return { kind: 'AT_BAT_OVER', displayText: '고의사구 — 볼넷', displayKind: 'hit', atBatResult: res, newBalls: 4, newStrikes: strikes }
  }

  // SQUEEZE
  if (batting === 'SQUEEZE') {
    if (!bases.third) {
      // No 3rd runner — treat as bunt
      return resolveBuntFinal(batter, bases, outs, balls, strikes)
    }
    const r = rand()
    if (r < 0.15) {
      const res: AtBatResult = {
        type: 'SQUEEZE_FAIL', text: `${batter.name} 스퀴즈 실패! ${bases.third.name} 아웃`,
        runnersBefore: bases, runnersAfter: { ...bases, third: null },
        runsScored: 0, outs: 1, batterOut: false,
      }
      return { kind: 'AT_BAT_OVER', displayText: '스퀴즈 실패!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: strikes }
    }
    const adv = advanceRunners(bases, 'SQUEEZE_SUCCESS', batter, outs)
    const res: AtBatResult = {
      type: 'SQUEEZE_SUCCESS', text: `${batter.name} 스퀴즈 성공! · ${adv.runDesc.join(' ')}`,
      runnersBefore: bases, runnersAfter: adv.bases,
      runsScored: adv.runsScored, outs: 1, batterOut: true,
    }
    return { kind: 'AT_BAT_OVER', displayText: '스퀴즈 성공! 득점!', displayKind: 'run', atBatResult: res, newBalls: balls, newStrikes: strikes }
  }

  // BUNT — always resolves at-bat
  if (batting === 'BUNT') {
    return resolveBuntFinal(batter, bases, outs, balls, strikes)
  }

  // Count + pitching command adjustment
  const countAdv = getCountAdv(balls, strikes)
  const pitchAdj = pitching === 'ATTACK' ? -0.5 : pitching === 'CAREFUL' ? 0.5 : 0
  const totalAdv = countAdv + pitchAdj  // positive = hitter friendly

  // TAKE — resolves to walk or K based on count
  if (batting === 'TAKE') {
    const walkProb = clamp(0.12 + totalAdv * 0.10, 0.03, 0.90)
    if (rand() < walkProb) {
      const res = resolveWalk('WALK', batter, bases)
      return { kind: 'AT_BAT_OVER', displayText: '볼넷!', displayKind: 'hit', atBatResult: res, newBalls: 4, newStrikes: strikes }
    }
    const ks = resolveStrikeout(batter, false)
    ks.runnersBefore = bases; ks.runnersAfter = bases
    return { kind: 'AT_BAT_OVER', displayText: '루킹 삼진!', displayKind: 'out', atBatResult: ks, newBalls: balls, newStrikes: 3 }
  }

  // SWING / HIT_AND_RUN
  const isHNR = batting === 'HIT_AND_RUN'

  // K probability: decreases on hitter's count, increases on pitcher's count
  const kProb = clamp(0.22 - totalAdv * 0.04 + (pitcher.era - 4.0) * 0.01, 0.06, 0.55)
  if (rand() < kProb) {
    const res = resolveStrikeout(batter, true)
    res.runnersBefore = bases; res.runnersAfter = bases
    if (isHNR && bases.first) {
      const caught = rand() < 0.60
      if (caught) {
        res.text += ` (히트앤런 실패, ${bases.first.name} 아웃)`
        res.outs = 2
        res.runnersAfter = { ...bases, first: null }
      }
    }
    return { kind: 'AT_BAT_OVER', displayText: '헛스윙 삼진!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: 3 }
  }

  // Fair contact with count-boosted avg
  const avgBoost = totalAdv * 0.015
  const boostedBatter = { ...batter, avg: clamp(batter.avg + avgBoost, 0.150, 0.500) }
  let res = resolveFairContact(boostedBatter, pitcher, bases, outs)
  if (isHNR && bases.first && !res.batterOut) {
    res = { ...res, text: '[히트앤런] ' + res.text }
  }
  const dispKind = res.runsScored > 0 ? 'run'
    : res.batterOut ? 'out'
    : ['SINGLE','DOUBLE','TRIPLE','HR','INFIELD_HIT','BUNT_HIT'].includes(res.type) ? 'hit'
    : 'out'
  return { kind: 'AT_BAT_OVER', displayText: getBigResultText(res.type, boostedBatter), displayKind: dispKind, atBatResult: res, newBalls: balls, newStrikes: strikes }
}

// ─── Pickoff ─────────────────────────────────────────────────────

export function simulatePickoff(
  game: GameState,
  base: 'first' | 'second' | 'third',
): { result: 'safe' | 'out' | 'error'; newGame: GameState } {
  const runner = game.bases[base]
  if (!runner) {
    return {
      result: 'safe',
      newGame: { ...game, phase: 'SHOW_PITCH', lastPitch: { text: '견제 — 주자 없음', kind: 'ball', isAtBatOver: false } },
    }
  }

  const roll = rand()
  if (roll < 0.20) {
    const newBases = { ...game.bases, [base]: null }
    const newOuts = game.outs + 1
    const text = `${runner.name} 견제 아웃!`
    const phase: GamePhase = newOuts >= 3 ? 'BETWEEN_HALF' : 'SHOW_PITCH'
    return {
      result: 'out',
      newGame: checkGameOver({
        ...game,
        bases: newBases,
        outs: newOuts,
        phase,
        lastPitch: { text, kind: 'out', isAtBatOver: false },
        events: [makeEvent(text, 'out'), ...game.events].slice(0, 30),
      }),
    }
  }

  if (roll < 0.30) {
    const ORDER = ['first', 'second', 'third'] as const
    const idx = ORDER.indexOf(base)
    const newBases = { ...game.bases }
    if (idx < 2 && !game.bases[ORDER[idx + 1]]) {
      newBases[base] = null
      newBases[ORDER[idx + 1]] = runner
    }
    const text = `견제 에러! ${runner.name} 진루`
    return {
      result: 'error',
      newGame: {
        ...game,
        bases: newBases,
        phase: 'SHOW_PITCH',
        lastPitch: { text, kind: 'steal', isAtBatOver: false },
        events: [makeEvent(text, 'info'), ...game.events].slice(0, 30),
      },
    }
  }

  return {
    result: 'safe',
    newGame: {
      ...game,
      phase: 'SHOW_PITCH',
      lastPitch: { text: `${runner.name} 귀루`, kind: 'ball', isAtBatOver: false },
    },
  }
}

function resolveBuntFinal(batter: Batter, bases: BaseState, outs: number, balls: number, strikes: number): SinglePitchResult {
  const r = rand()
  if (r < 0.08) {
    const res: AtBatResult = { type: 'BUNT_OUT', text: `${batter.name} 번트 팝업 아웃`, runnersBefore: bases, runnersAfter: bases, runsScored: 0, outs: 1, batterOut: true }
    return { kind: 'AT_BAT_OVER', displayText: '번트 팝업 아웃!', displayKind: 'out', atBatResult: res, newBalls: balls, newStrikes: strikes }
  }
  if (r < 0.20 + batter.speed * 0.04) {
    const adv = advanceRunners(bases, 'BUNT_HIT', batter, outs)
    const res: AtBatResult = { type: 'BUNT_HIT', text: `${batter.name} 번트 안타!` + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''), runnersBefore: bases, runnersAfter: adv.bases, runsScored: adv.runsScored, outs: 0, batterOut: false }
    return { kind: 'AT_BAT_OVER', displayText: '번트 안타!', displayKind: 'hit', atBatResult: res, newBalls: balls, newStrikes: strikes }
  }
  const adv = advanceRunners(bases, 'SAC_BUNT', batter, outs)
  const res: AtBatResult = { type: 'SAC_BUNT', text: `${batter.name} 희생번트` + (adv.runDesc.length ? ' · ' + adv.runDesc.join(' ') : ''), runnersBefore: bases, runnersAfter: adv.bases, runsScored: adv.runsScored, outs: 1, batterOut: true }
  return { kind: 'AT_BAT_OVER', displayText: adv.runsScored > 0 ? '희생번트 · 득점!' : '희생번트 성공', displayKind: adv.runsScored > 0 ? 'run' : 'out', atBatResult: res, newBalls: balls, newStrikes: strikes }
}
