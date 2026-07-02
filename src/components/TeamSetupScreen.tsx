'use client'
import { useState } from 'react'
import type { AppScreen, TeamColor, InningMode, PitchMode } from '@/lib/types'
import { KBO_TEAMS, TEAM_COLORS, getTeamColorHex, buildTeamsFromKBO } from '@/lib/defaultData'
import { clearSave } from '@/lib/storage'

type SaveInfo = {
  shortName: string
  emoji: string
  color: TeamColor
  roundLabel: string
  screen: AppScreen
}

interface Props {
  onStart: (params: {
    selectedTeamId: number
    inningMode: InningMode
    pitchMode: PitchMode
    overrides: Partial<{ name: string; shortName: string; color: TeamColor }>[]
  }) => void
  saveInfo?: SaveInfo | null
  onContinue?: () => void
}

const INNING_MODES: { mode: InningMode; label: string; desc: string; icon: string }[] = [
  { mode: 'full',   label: '전체 경기', desc: '1회부터 9회까지 풀 경기', icon: '⚾' },
  { mode: 'from7',  label: '7회부터',   desc: '7회부터 플레이 (이전 점수 랜덤)', icon: '⚡' },
  { mode: 'from9',  label: '9회만',     desc: '9회만 플레이 (초긴장 클러치 상황)', icon: '🔥' },
]

const PITCH_MODES: { mode: PitchMode; label: string; desc: string; icon: string }[] = [
  { mode: 'all',   label: '전체 투구 지시',   desc: '0-0부터 한 구 한 구 직접 지시 — 최고 몰입감', icon: '🎯' },
  { mode: 'mid',   label: '중간 카운트부터',   desc: '랜덤 카운트로 시작, 거기서부터 투구 지시 — 균형형', icon: '🎲' },
  { mode: 'final', label: '마지막 한 구만 지시', desc: '볼카운트 랜덤 제시 후 결정 1회로 타석 종료 — 빠른 진행', icon: '⚡' },
]

export default function TeamSetupScreen({ onStart, saveInfo, onContinue }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [inningMode, setInningMode] = useState<InningMode>('full')
  const [pitchMode, setPitchMode] = useState<PitchMode>('all')
  const [showCustomize, setShowCustomize] = useState(false)
  const [overrides, setOverrides] = useState<Partial<{ name: string; shortName: string; color: TeamColor }>[]>(
    Array.from({ length: 10 }, () => ({}))
  )
  const [editIdx, setEditIdx] = useState<number | null>(null)

  function updateOverride(idx: number, field: string, value: string) {
    setOverrides(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o))
  }

  function handleStart() {
    if (selectedTeamId === null) return
    onStart({ selectedTeamId, inningMode, pitchMode, overrides })
  }

  // ─── Step 1: Team selection ───────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-8 gap-6">

        {/* Continue banner */}
        {saveInfo && onContinue && (
          <ContinueBanner saveInfo={saveInfo} onContinue={onContinue} />
        )}

        <div className="text-center max-w-sm">
          <div className="text-xs text-yellow-500 tracking-widest uppercase mb-2">KBO 야구 감독 시뮬레이터</div>
          <h1 className="text-3xl font-black mb-2">팀 선택</h1>
          <p className="text-sm text-gray-400">감독으로 이끌 팀을 선택하세요.<br/>선택한 팀은 <span className="text-yellow-400 font-bold">5위 (와일드카드)</span>로 포스트시즌에 진출합니다.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {KBO_TEAMS.map((team) => {
            const hex = getTeamColorHex(team.color)
            const selected = selectedTeamId === team.id
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  selected ? 'scale-105 shadow-xl' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
                style={selected ? { borderColor: hex, backgroundColor: hex + '18' } : {}}
              >
                <span className="text-3xl">{team.emoji}</span>
                <div className="text-center">
                  <div className={`font-black text-sm ${selected ? 'text-white' : 'text-gray-200'}`}>
                    {team.shortName}
                  </div>
                  <div className="text-xs text-gray-500">{team.city}</div>
                </div>
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ backgroundColor: hex }}
                />
                <div className="text-[10px] text-gray-500">{team.wins}승 {team.losses}패</div>
              </button>
            )
          })}
        </div>

        <button
          disabled={selectedTeamId === null}
          onClick={() => setStep(2)}
          className="w-full max-w-sm py-4 rounded-2xl font-black text-xl text-white
            transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
          style={{ backgroundColor: selectedTeamId !== null ? getTeamColorHex(KBO_TEAMS[selectedTeamId]?.color ?? 'blue') : '#374151' }}
        >
          {selectedTeamId !== null ? `${KBO_TEAMS.find(t => t.id === selectedTeamId)?.shortName} 선택 →` : '팀을 선택하세요'}
        </button>
      </div>
    )
  }

  // ─── Step 2: Inning mode ──────────────────────────────────────
  const selectedTeam = KBO_TEAMS.find(t => t.id === selectedTeamId)!
  const teamHex = getTeamColorHex(selectedTeam.color)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-8 gap-6">
      <div className="text-center max-w-sm">
        <button onClick={() => setStep(1)} className="text-xs text-gray-500 mb-3 hover:text-gray-300">← 팀 다시 선택</button>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-4xl">{selectedTeam.emoji}</span>
          <div>
            <div className="font-black text-xl" style={{ color: teamHex }}>{selectedTeam.name}</div>
            <div className="text-xs text-gray-400">감독 선택 완료 ✓</div>
          </div>
        </div>
        <h2 className="text-2xl font-black mb-1">게임 설정</h2>
        <p className="text-sm text-gray-400">이닝과 투구 지시 방식을 선택하세요.</p>
      </div>

      {/* Inning mode */}
      <div className="w-full max-w-sm">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-1">이닝 시작</div>
        <div className="space-y-2">
          {INNING_MODES.map(({ mode, label, desc, icon }) => {
            const active = inningMode === mode
            return (
              <button
                key={mode}
                onClick={() => setInningMode(mode)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                  active ? 'shadow-lg' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
                style={active ? { borderColor: teamHex, backgroundColor: teamHex + '15' } : {}}
              >
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <div className={`font-black text-sm ${active ? 'text-white' : 'text-gray-200'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
                {active && <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: teamHex }}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                </div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pitch mode */}
      <div className="w-full max-w-sm">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-1">투구 지시 방식</div>
        <div className="space-y-2">
          {PITCH_MODES.map(({ mode, label, desc, icon }) => {
            const active = pitchMode === mode
            return (
              <button
                key={mode}
                onClick={() => setPitchMode(mode)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                  active ? 'shadow-lg' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
                style={active ? { borderColor: teamHex, backgroundColor: teamHex + '15' } : {}}
              >
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                  <div className={`font-black text-sm ${active ? 'text-white' : 'text-gray-200'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
                {active && <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: teamHex }}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                </div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Optional team name customization */}
      <div className="w-full max-w-sm">
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors"
        >
          {showCustomize ? '▲ 팀 이름/색상 편집 닫기' : '▼ 팀 이름/색상 편집 (선택사항)'}
        </button>

        {showCustomize && (
          <div className="mt-3 space-y-2">
            <TeamCustomizeList overrides={overrides} selectedTeamId={selectedTeamId!} updateOverride={updateOverride} />
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        className="w-full max-w-sm py-5 rounded-2xl font-black text-xl text-gray-900
          transition-all active:scale-95 shadow-2xl"
        style={{ backgroundColor: teamHex }}
      >
        포스트시즌 시작! 🏆
      </button>
    </div>
  )
}

// ─── Continue banner ─────────────────────────────────────────────

function ContinueBanner({ saveInfo, onContinue }: { saveInfo: SaveInfo; onContinue: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  const hex = getTeamColorHex(saveInfo.color)

  function handleDelete() {
    clearSave()
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">{saveInfo.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-0.5">이전 게임이 저장되어 있습니다</div>
          <div className="font-black text-sm" style={{ color: hex }}>
            {saveInfo.shortName} · {saveInfo.roundLabel}
          </div>
        </div>
      </div>
      <div className="flex border-t border-gray-800">
        <button
          onClick={onContinue}
          className="flex-1 py-2.5 text-sm font-black text-white transition-colors"
          style={{ backgroundColor: hex + '22' }}
        >
          이어하기
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 transition-colors border-l border-gray-800"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

// ─── Team customization sub-component ────────────────────────────

function TeamCustomizeList({
  overrides, selectedTeamId, updateOverride
}: {
  overrides: Partial<{ name: string; shortName: string; color: TeamColor }>[]
  selectedTeamId: number
  updateOverride: (idx: number, field: string, value: string) => void
}) {
  // Build the reordered team list (same logic as buildTeamsFromKBO)
  const reordered = [...KBO_TEAMS]
  const playerOriginalIdx = reordered.findIndex(t => t.id === selectedTeamId)
  ;[reordered[4], reordered[playerOriginalIdx]] = [reordered[playerOriginalIdx], reordered[4]]

  const [editIdx, setEditIdx] = useState<number | null>(null)
  const ranks = ['1위', '2위', '3위', '4위', '5위★', '6위', '7위', '8위', '9위', '10위']

  return (
    <>
      {reordered.map((team, rank) => {
        const ovr = overrides[rank]
        const name = ovr?.name ?? team.name
        const color = ovr?.color ?? team.color
        const hex = getTeamColorHex(color)
        const isEditing = editIdx === rank
        const isPlayer = rank === 4

        return (
          <div key={team.id} className={`rounded-xl overflow-hidden border ${isPlayer ? 'border-yellow-500/40' : 'border-gray-700'}`}>
            {!isEditing ? (
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-900 hover:bg-gray-800 text-left"
                onClick={() => setEditIdx(rank)}
              >
                <span className="text-xs text-gray-500 w-10">{ranks[rank]}</span>
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
                <span className={`text-sm font-bold flex-1 ${isPlayer ? 'text-yellow-300' : 'text-white'}`}>{name}</span>
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            ) : (
              <div className="bg-gray-900 p-3 space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">팀 이름</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:border-gray-400 focus:outline-none"
                    value={ovr?.name ?? team.name}
                    onChange={e => updateOverride(rank, 'name', e.target.value)}
                    maxLength={12}
                    placeholder={team.name}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">색상</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {TEAM_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => updateOverride(rank, 'color', c.value)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c.value ? 'scale-110 border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setEditIdx(null)}
                  className="w-full py-1.5 bg-gray-700 rounded-lg text-xs font-bold text-gray-200"
                >완료</button>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
