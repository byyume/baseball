import type { Team, TeamColor, BatterPosition } from './types'

// ─── Real KBO Teams (2024 regular season order) ───────────────────

export interface KBOTeamDef {
  id: number
  name: string
  shortName: string
  city: string
  color: TeamColor
  wins: number
  losses: number
  draws: number
  emoji: string
}

export const KBO_TEAMS: KBOTeamDef[] = [
  { id: 0, name: 'KIA 타이거즈',  shortName: 'KIA',  city: '광주', color: 'red',    wins: 87, losses: 56, draws: 1, emoji: '🐯' },
  { id: 1, name: '삼성 라이온즈', shortName: '삼성', city: '대구', color: 'blue',   wins: 78, losses: 66, draws: 0, emoji: '🦁' },
  { id: 2, name: 'LG 트윈스',     shortName: 'LG',   city: '서울', color: 'rose',   wins: 75, losses: 69, draws: 0, emoji: '⚾' },
  { id: 3, name: '두산 베어스',   shortName: '두산', city: '서울', color: 'indigo', wins: 74, losses: 70, draws: 0, emoji: '🐻' },
  { id: 4, name: 'KT 위즈',       shortName: 'KT',   city: '수원', color: 'teal',   wins: 70, losses: 73, draws: 1, emoji: '🧙' },
  { id: 5, name: 'SSG 랜더스',    shortName: 'SSG',  city: '인천', color: 'orange', wins: 68, losses: 75, draws: 1, emoji: '🚀' },
  { id: 6, name: 'NC 다이노스',   shortName: 'NC',   city: '창원', color: 'green',  wins: 67, losses: 77, draws: 0, emoji: '🦕' },
  { id: 7, name: '롯데 자이언츠', shortName: '롯데', city: '부산', color: 'pink',   wins: 63, losses: 80, draws: 1, emoji: '🏔️' },
  { id: 8, name: '한화 이글스',   shortName: '한화', city: '대전', color: 'yellow', wins: 62, losses: 82, draws: 0, emoji: '🦅' },
  { id: 9, name: '키움 히어로즈', shortName: '키움', city: '서울', color: 'purple', wins: 56, losses: 88, draws: 0, emoji: '⚡' },
]

// ─── 2024 KBO Real Rosters ────────────────────────────────────────

type B = { n: string; p: BatterPosition; avg: number; pow: number; spd: number }
type P = { n: string; era: number; ctl: number; stm: number; str: boolean }

const ROSTERS: Record<number, { b: B[]; p: P[] }> = {
  // ── 0: KIA 타이거즈 ──────────────────────────────────────────────
  0: {
    b: [
      { n: '박찬호',    p: 'SS',  avg: .278, pow: 2, spd: 4 },
      { n: '김도영',    p: '3B',  avg: .347, pow: 5, spd: 5 },
      { n: '나성범',    p: 'LF',  avg: .283, pow: 3, spd: 3 },
      { n: '소크라테스', p: 'RF',  avg: .314, pow: 4, spd: 3 },
      { n: '최형우',    p: 'DH',  avg: .295, pow: 4, spd: 2 },
      { n: '이우성',    p: '1B',  avg: .287, pow: 3, spd: 2 },
      { n: '김선빈',    p: '2B',  avg: .272, pow: 2, spd: 3 },
      { n: '한준수',    p: 'C',   avg: .258, pow: 2, spd: 2 },
      { n: '이창진',    p: 'CF',  avg: .268, pow: 2, spd: 4 },
    ],
    p: [
      { n: '양현종',    era: 3.45, ctl: 5, stm: 90, str: true  },
      { n: '제임스 네일', era: 3.18, ctl: 4, stm: 85, str: true  },
      { n: '윤영철',    era: 4.25, ctl: 3, stm: 75, str: true  },
      { n: '이의리',    era: 5.12, ctl: 3, stm: 70, str: true  },
      { n: '황동하',    era: 4.78, ctl: 3, stm: 65, str: true  },
      { n: '정해영',    era: 1.89, ctl: 5, stm: 55, str: false },
      { n: '전상현',    era: 3.76, ctl: 3, stm: 55, str: false },
      { n: '이준영',    era: 4.56, ctl: 2, stm: 50, str: false },
      { n: '박준표',    era: 5.20, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 1: 삼성 라이온즈 ─────────────────────────────────────────────
  1: {
    b: [
      { n: '이재현',    p: '2B',  avg: .298, pow: 2, spd: 4 },
      { n: '구자욱',    p: 'LF',  avg: .332, pow: 4, spd: 3 },
      { n: '김영웅',    p: '3B',  avg: .285, pow: 4, spd: 3 },
      { n: '호세 피렐라', p: 'RF', avg: .296, pow: 4, spd: 3 },
      { n: '강민호',    p: 'C',   avg: .264, pow: 3, spd: 2 },
      { n: '디아스',    p: '1B',  avg: .278, pow: 4, spd: 2 },
      { n: '김지찬',    p: 'CF',  avg: .277, pow: 2, spd: 5 },
      { n: '류지혁',    p: 'SS',  avg: .258, pow: 2, spd: 3 },
      { n: '박병호',    p: 'DH',  avg: .246, pow: 4, spd: 2 },
    ],
    p: [
      { n: '원태인',    era: 2.77, ctl: 5, stm: 90, str: true  },
      { n: '최채흥',    era: 3.54, ctl: 3, stm: 80, str: true  },
      { n: '스미스',    era: 4.24, ctl: 3, stm: 75, str: true  },
      { n: '뷰캐넌',    era: 4.68, ctl: 3, stm: 70, str: true  },
      { n: '이승현',    era: 5.10, ctl: 2, stm: 65, str: true  },
      { n: '오승환',    era: 4.06, ctl: 4, stm: 55, str: false },
      { n: '허윤동',    era: 3.42, ctl: 3, stm: 55, str: false },
      { n: '심창민',    era: 4.82, ctl: 2, stm: 50, str: false },
      { n: '황준서',    era: 5.40, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 2: LG 트윈스 ─────────────────────────────────────────────────
  2: {
    b: [
      { n: '홍창기',    p: 'CF',  avg: .302, pow: 2, spd: 5 },
      { n: '오지환',    p: 'SS',  avg: .272, pow: 3, spd: 3 },
      { n: '오스틴',    p: '1B',  avg: .317, pow: 5, spd: 2 },
      { n: '문보경',    p: '3B',  avg: .297, pow: 4, spd: 3 },
      { n: '박해민',    p: 'RF',  avg: .276, pow: 2, spd: 5 },
      { n: '김현수',    p: 'DH',  avg: .288, pow: 3, spd: 2 },
      { n: '박동원',    p: 'C',   avg: .264, pow: 3, spd: 2 },
      { n: '신민재',    p: '2B',  avg: .272, pow: 2, spd: 4 },
      { n: '문성주',    p: 'LF',  avg: .261, pow: 2, spd: 4 },
    ],
    p: [
      { n: '임찬규',    era: 3.62, ctl: 4, stm: 85, str: true  },
      { n: '플럿코',    era: 3.84, ctl: 3, stm: 80, str: true  },
      { n: '브래드포드', era: 4.12, ctl: 3, stm: 75, str: true  },
      { n: '이민호',    era: 4.64, ctl: 3, stm: 70, str: true  },
      { n: '박명근',    era: 5.08, ctl: 2, stm: 65, str: true  },
      { n: '고우석',    era: 1.97, ctl: 5, stm: 55, str: false },
      { n: '유영찬',    era: 3.78, ctl: 3, stm: 55, str: false },
      { n: '정우영',    era: 4.22, ctl: 3, stm: 50, str: false },
      { n: '함덕주',    era: 4.84, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 3: 두산 베어스 ───────────────────────────────────────────────
  3: {
    b: [
      { n: '정수빈',    p: 'CF',  avg: .268, pow: 2, spd: 5 },
      { n: '양의지',    p: 'C',   avg: .296, pow: 4, spd: 2 },
      { n: '김재환',    p: 'RF',  avg: .289, pow: 5, spd: 3 },
      { n: '박건우',    p: 'LF',  avg: .295, pow: 3, spd: 3 },
      { n: '페르난데스', p: '1B',  avg: .285, pow: 5, spd: 2 },
      { n: '강승호',    p: '3B',  avg: .278, pow: 3, spd: 3 },
      { n: '허경민',    p: '2B',  avg: .272, pow: 2, spd: 3 },
      { n: '박세혁',    p: 'SS',  avg: .254, pow: 2, spd: 4 },
      { n: '전민재',    p: 'DH',  avg: .257, pow: 3, spd: 2 },
    ],
    p: [
      { n: '브랜든',    era: 3.92, ctl: 3, stm: 85, str: true  },
      { n: '로버트 스탁', era: 4.24, ctl: 3, stm: 80, str: true  },
      { n: '곽빈',      era: 4.54, ctl: 3, stm: 75, str: true  },
      { n: '최원준',    era: 5.12, ctl: 2, stm: 65, str: true  },
      { n: '김명신',    era: 5.42, ctl: 2, stm: 60, str: true  },
      { n: '홍건희',    era: 2.45, ctl: 4, stm: 55, str: false },
      { n: '이병헌',    era: 3.88, ctl: 3, stm: 55, str: false },
      { n: '권휘',      era: 4.68, ctl: 2, stm: 50, str: false },
      { n: '박치국',    era: 5.18, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 4: KT 위즈 ───────────────────────────────────────────────────
  4: {
    b: [
      { n: '배정대',    p: 'LF',  avg: .277, pow: 3, spd: 4 },
      { n: '강백호',    p: '1B',  avg: .297, pow: 4, spd: 3 },
      { n: '황재균',    p: '3B',  avg: .274, pow: 3, spd: 3 },
      { n: '문상철',    p: 'RF',  avg: .283, pow: 4, spd: 3 },
      { n: '심우준',    p: 'SS',  avg: .261, pow: 2, spd: 4 },
      { n: '박경수',    p: '2B',  avg: .262, pow: 2, spd: 3 },
      { n: '장성우',    p: 'C',   avg: .260, pow: 2, spd: 2 },
      { n: '조용호',    p: 'CF',  avg: .255, pow: 2, spd: 4 },
      { n: '김민혁',    p: 'DH',  avg: .251, pow: 3, spd: 2 },
    ],
    p: [
      { n: '쿠에바스',  era: 3.96, ctl: 4, stm: 85, str: true  },
      { n: '소형준',    era: 4.28, ctl: 3, stm: 80, str: true  },
      { n: '벤자민',    era: 4.52, ctl: 3, stm: 75, str: true  },
      { n: '엄상백',    era: 4.84, ctl: 3, stm: 70, str: true  },
      { n: '이상동',    era: 5.24, ctl: 2, stm: 60, str: true  },
      { n: '조상우',    era: 2.34, ctl: 4, stm: 55, str: false },
      { n: '박영현',    era: 3.64, ctl: 3, stm: 55, str: false },
      { n: '신재웅',    era: 4.90, ctl: 2, stm: 50, str: false },
      { n: '이유찬',    era: 5.36, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 5: SSG 랜더스 ────────────────────────────────────────────────
  5: {
    b: [
      { n: '박성한',    p: 'SS',  avg: .261, pow: 2, spd: 4 },
      { n: '한유섬',    p: 'LF',  avg: .296, pow: 4, spd: 3 },
      { n: '최정',      p: '3B',  avg: .271, pow: 5, spd: 2 },
      { n: '에레디아',  p: 'RF',  avg: .284, pow: 3, spd: 3 },
      { n: '최주환',    p: '2B',  avg: .276, pow: 3, spd: 3 },
      { n: '오태곤',    p: '1B',  avg: .272, pow: 3, spd: 2 },
      { n: '김강민',    p: 'CF',  avg: .266, pow: 2, spd: 5 },
      { n: '이재원',    p: 'C',   avg: .251, pow: 3, spd: 2 },
      { n: '전의산',    p: 'DH',  avg: .265, pow: 2, spd: 3 },
    ],
    p: [
      { n: '김광현',    era: 3.12, ctl: 5, stm: 90, str: true  },
      { n: '오원석',    era: 3.88, ctl: 4, stm: 80, str: true  },
      { n: '서진용',    era: 4.36, ctl: 3, stm: 75, str: true  },
      { n: '블랑코',    era: 4.90, ctl: 3, stm: 70, str: true  },
      { n: '알칸타라',  era: 5.22, ctl: 2, stm: 60, str: true  },
      { n: '이적',      era: 3.06, ctl: 4, stm: 55, str: false },
      { n: '박종훈',    era: 4.12, ctl: 3, stm: 55, str: false },
      { n: '김기훈',    era: 4.78, ctl: 2, stm: 50, str: false },
      { n: '정찬헌',    era: 5.42, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 6: NC 다이노스 ───────────────────────────────────────────────
  6: {
    b: [
      { n: '박민우',    p: '2B',  avg: .282, pow: 2, spd: 5 },
      { n: '손아섭',    p: 'LF',  avg: .289, pow: 3, spd: 3 },
      { n: '권희동',    p: 'RF',  avg: .281, pow: 3, spd: 3 },
      { n: '아론 알테어', p: '1B', avg: .292, pow: 5, spd: 2 },
      { n: '오영수',    p: '3B',  avg: .262, pow: 3, spd: 3 },
      { n: '도태훈',    p: 'SS',  avg: .252, pow: 2, spd: 4 },
      { n: '이명기',    p: 'CF',  avg: .273, pow: 2, spd: 4 },
      { n: '박정민',    p: 'C',   avg: .251, pow: 2, spd: 2 },
      { n: '천재환',    p: 'DH',  avg: .258, pow: 2, spd: 3 },
    ],
    p: [
      { n: '루친스키',  era: 3.76, ctl: 4, stm: 85, str: true  },
      { n: '카일 하트', era: 4.02, ctl: 3, stm: 80, str: true  },
      { n: '신민혁',    era: 4.48, ctl: 3, stm: 75, str: true  },
      { n: '오동욱',    era: 4.86, ctl: 3, stm: 70, str: true  },
      { n: '이재학',    era: 5.12, ctl: 2, stm: 65, str: true  },
      { n: '원상현',    era: 2.78, ctl: 4, stm: 55, str: false },
      { n: '임창민',    era: 3.94, ctl: 3, stm: 55, str: false },
      { n: '박시영',    era: 4.68, ctl: 2, stm: 50, str: false },
      { n: '서의태',    era: 5.22, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 7: 롯데 자이언츠 ─────────────────────────────────────────────
  7: {
    b: [
      { n: '전준우',    p: 'CF',  avg: .284, pow: 3, spd: 4 },
      { n: '안치홍',    p: '2B',  avg: .291, pow: 3, spd: 3 },
      { n: '빅터 레이예스', p: 'LF', avg: .310, pow: 4, spd: 3 },
      { n: '한동희',    p: '1B',  avg: .276, pow: 4, spd: 2 },
      { n: '정훈',      p: '3B',  avg: .266, pow: 2, spd: 3 },
      { n: '고승민',    p: 'RF',  avg: .269, pow: 2, spd: 4 },
      { n: '황성빈',    p: 'SS',  avg: .264, pow: 2, spd: 5 },
      { n: '유강남',    p: 'C',   avg: .259, pow: 2, spd: 2 },
      { n: '박승욱',    p: 'DH',  avg: .257, pow: 3, spd: 2 },
    ],
    p: [
      { n: '나균안',    era: 3.68, ctl: 4, stm: 85, str: true  },
      { n: '찰리 반즈', era: 4.14, ctl: 3, stm: 80, str: true  },
      { n: '댄 스트레일리', era: 4.56, ctl: 3, stm: 75, str: true  },
      { n: '이인복',    era: 4.96, ctl: 2, stm: 65, str: true  },
      { n: '임준섭',    era: 5.24, ctl: 2, stm: 60, str: true  },
      { n: '구승민',    era: 2.52, ctl: 4, stm: 55, str: false },
      { n: '김원중',    era: 3.78, ctl: 3, stm: 55, str: false },
      { n: '박진형',    era: 4.62, ctl: 2, stm: 50, str: false },
      { n: '윤명준',    era: 5.32, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 8: 한화 이글스 ───────────────────────────────────────────────
  8: {
    b: [
      { n: '페라자',    p: 'SS',  avg: .273, pow: 4, spd: 4 },
      { n: '문현빈',    p: 'LF',  avg: .279, pow: 3, spd: 4 },
      { n: '노시환',    p: '3B',  avg: .290, pow: 5, spd: 3 },
      { n: '채은성',    p: '1B',  avg: .283, pow: 4, spd: 2 },
      { n: '김인환',    p: 'RF',  avg: .268, pow: 3, spd: 3 },
      { n: '이성규',    p: 'CF',  avg: .261, pow: 2, spd: 4 },
      { n: '하주석',    p: '2B',  avg: .255, pow: 2, spd: 3 },
      { n: '최재훈',    p: 'C',   avg: .251, pow: 2, spd: 2 },
      { n: '이도윤',    p: 'DH',  avg: .258, pow: 2, spd: 3 },
    ],
    p: [
      { n: '류현진',    era: 3.72, ctl: 5, stm: 85, str: true  },
      { n: '라이언 카펜터', era: 4.36, ctl: 3, stm: 80, str: true  },
      { n: '문동주',    era: 4.62, ctl: 3, stm: 75, str: true  },
      { n: '이태양',    era: 4.88, ctl: 3, stm: 70, str: true  },
      { n: '김민우',    era: 5.18, ctl: 2, stm: 65, str: true  },
      { n: '주현상',    era: 3.24, ctl: 4, stm: 55, str: false },
      { n: '박상원',    era: 4.06, ctl: 3, stm: 55, str: false },
      { n: '한승혁',    era: 4.74, ctl: 2, stm: 50, str: false },
      { n: '오장원',    era: 5.40, ctl: 2, stm: 45, str: false },
    ],
  },
  // ── 9: 키움 히어로즈 ─────────────────────────────────────────────
  9: {
    b: [
      { n: '김혜성',    p: '2B',  avg: .312, pow: 2, spd: 5 },
      { n: '이주형',    p: 'CF',  avg: .276, pow: 3, spd: 5 },
      { n: '이원석',    p: '3B',  avg: .276, pow: 3, spd: 3 },
      { n: '송성문',    p: '1B',  avg: .282, pow: 3, spd: 2 },
      { n: '로하스 Jr.', p: 'RF', avg: .276, pow: 4, spd: 3 },
      { n: '이병규',    p: 'LF',  avg: .259, pow: 2, spd: 3 },
      { n: '한승택',    p: 'SS',  avg: .257, pow: 2, spd: 4 },
      { n: '이지영',    p: 'C',   avg: .254, pow: 2, spd: 2 },
      { n: '정민혁',    p: 'DH',  avg: .250, pow: 2, spd: 3 },
    ],
    p: [
      { n: '안우진',    era: 3.46, ctl: 4, stm: 85, str: true  },
      { n: '하영민',    era: 4.12, ctl: 3, stm: 80, str: true  },
      { n: '최원태',    era: 4.68, ctl: 3, stm: 75, str: true  },
      { n: '김선기',    era: 5.02, ctl: 2, stm: 65, str: true  },
      { n: '장재영',    era: 5.38, ctl: 2, stm: 60, str: true  },
      { n: '김재웅',    era: 2.96, ctl: 4, stm: 55, str: false },
      { n: '신보현',    era: 3.82, ctl: 3, stm: 55, str: false },
      { n: '이승호',    era: 4.54, ctl: 2, stm: 50, str: false },
      { n: '주승우',    era: 5.08, ctl: 2, stm: 45, str: false },
    ],
  },
}

// ─── Build Teams from KBO defs ────────────────────────────────────

export function buildTeamsFromKBO(
  playerTeamId: number,
  overrides: Partial<{ name: string; shortName: string; color: TeamColor }>[] = [],
): { teams: Team[]; playerIndex: number } {
  const playerDef = KBO_TEAMS.find(t => t.id === playerTeamId)
  if (!playerDef) throw new Error('Unknown team id')

  // Randomly pick 4 opponents from the remaining 9 teams, then sort by wins desc
  const others = KBO_TEAMS.filter(t => t.id !== playerTeamId)
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[others[i], others[j]] = [others[j], others[i]]
  }
  const top4 = others.slice(0, 4).sort((a, b) => b.wins - a.wins)

  // Final standings: [1위, 2위, 3위, 4위, 5위(player)]
  const reordered = [...top4, playerDef]

  const teams: Team[] = reordered.map((def, rank) => {
    const ovr = overrides[rank] ?? {}
    const roster = ROSTERS[def.id]
    return {
      id: def.id,
      name: ovr.name ?? def.name,
      shortName: ovr.shortName ?? def.shortName,
      color: ovr.color ?? def.color,
      batters: roster.b.map((b, i) => ({
        id: `b-${def.id}-${i}`,
        name: b.n,
        position: b.p,
        avg: b.avg,
        power: b.pow,
        speed: b.spd,
      })),
      pitchers: roster.p.map((p, i) => ({
        id: `p-${def.id}-${i}`,
        name: p.n,
        era: p.era,
        control: p.ctl,
        stamina: p.stm,
        isStarter: p.str,
      })),
      regularSeason: { wins: def.wins, losses: def.losses, draws: def.draws },
    }
  })

  return { teams, playerIndex: 4 }
}

// ─── Color helpers ────────────────────────────────────────────────

export const TEAM_COLORS: { value: TeamColor; label: string; hex: string }[] = [
  { value: 'blue',   label: '파랑',  hex: '#3b82f6' },
  { value: 'red',    label: '빨강',  hex: '#ef4444' },
  { value: 'green',  label: '초록',  hex: '#22c55e' },
  { value: 'purple', label: '보라',  hex: '#a855f7' },
  { value: 'orange', label: '주황',  hex: '#f97316' },
  { value: 'yellow', label: '노랑',  hex: '#eab308' },
  { value: 'pink',   label: '분홍',  hex: '#ec4899' },
  { value: 'indigo', label: '인디고', hex: '#6366f1' },
  { value: 'teal',   label: '청록',  hex: '#14b8a6' },
  { value: 'rose',   label: '장미',  hex: '#f43f5e' },
]

export function getTeamColorHex(color: TeamColor): string {
  return TEAM_COLORS.find(c => c.value === color)?.hex ?? '#888'
}

export function getTeamTailwind(color: TeamColor): string {
  const map: Record<TeamColor, string> = {
    blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
    purple: 'bg-purple-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
    pink: 'bg-pink-500', indigo: 'bg-indigo-500', teal: 'bg-teal-500', rose: 'bg-rose-500',
  }
  return map[color] ?? 'bg-gray-500'
}
