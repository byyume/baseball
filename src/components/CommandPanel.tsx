'use client'
import type { BattingCommand, PitchingCommand, RunnerCommand, BaseState, TeamColor } from '@/lib/types'
import { getTeamColorHex } from '@/lib/defaultData'

// ─── Batting Panel ────────────────────────────────────────────────

interface BattingPanelProps {
  bases: BaseState
  outs: number
  isDisabled: boolean
  selectedBatting: BattingCommand
  selectedRunner: RunnerCommand
  onBatting: (cmd: BattingCommand) => void
  onRunner: (cmd: RunnerCommand) => void
  onConfirm: () => void
  playerColor: TeamColor
}

const BATTING_CMDS: { cmd: BattingCommand; label: string; emoji: string; shortDesc: string }[] = [
  { cmd: 'SWING',       label: '스윙',    emoji: '💥', shortDesc: '풀스윙' },
  { cmd: 'TAKE',        label: '봐',      emoji: '👀', shortDesc: '보내기' },
  { cmd: 'BUNT',        label: '번트',    emoji: '🏃', shortDesc: '희생번트' },
  { cmd: 'HIT_AND_RUN', label: '히트앤런', emoji: '💨', shortDesc: '주자 먼저' },
  { cmd: 'SQUEEZE',     label: '스퀴즈',  emoji: '🎯', shortDesc: '3루→홈' },
]

export function BattingCommandPanel({
  bases, outs, isDisabled, selectedBatting, selectedRunner,
  onBatting, onRunner, onConfirm, playerColor
}: BattingPanelProps) {
  const hex = getTeamColorHex(playerColor)
  const squeezeAvailable = !!bases.third && outs < 2
  const steal1Available = !!bases.first && !bases.second
  const steal2Available = !!bases.second && !bases.third
  const doubleStealAvailable = !!bases.first && !!bases.second

  const cmds = BATTING_CMDS.filter(c => {
    if (c.cmd === 'SQUEEZE') return squeezeAvailable
    if (c.cmd === 'HIT_AND_RUN') return !!bases.first || !!bases.second
    return true
  })

  return (
    <div className="flex flex-col gap-2.5">
      {/* Batting command grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {BATTING_CMDS.map(({ cmd, label, emoji, shortDesc }) => {
          const disabled = (cmd === 'SQUEEZE' && !squeezeAvailable)
          const active = selectedBatting === cmd
          return (
            <button
              key={cmd}
              disabled={disabled || isDisabled}
              onClick={() => onBatting(cmd)}
              className={`flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all duration-100
                ${disabled ? 'opacity-25 cursor-not-allowed border-transparent bg-gray-900'
                  : active
                    ? 'border-white scale-105 shadow-lg'
                    : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500 active:scale-95'
                }`}
              style={active ? { backgroundColor: hex + '25', borderColor: hex } : {}}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className="text-[10px] leading-tight text-center">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Runner commands */}
      {(steal1Available || steal2Available || doubleStealAvailable) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-500">주자:</span>
          {steal1Available && (
            <RunnerChip
              label="1→2 도루" selected={selectedRunner === 'STEAL_FIRST'}
              onClick={() => onRunner(selectedRunner === 'STEAL_FIRST' ? null : 'STEAL_FIRST')}
              color={hex} disabled={isDisabled}
            />
          )}
          {steal2Available && (
            <RunnerChip
              label="2→3 도루" selected={selectedRunner === 'STEAL_SECOND'}
              onClick={() => onRunner(selectedRunner === 'STEAL_SECOND' ? null : 'STEAL_SECOND')}
              color={hex} disabled={isDisabled}
            />
          )}
          {doubleStealAvailable && (
            <RunnerChip
              label="더블스틸" selected={selectedRunner === 'DOUBLE_STEAL'}
              onClick={() => onRunner(selectedRunner === 'DOUBLE_STEAL' ? null : 'DOUBLE_STEAL')}
              color={hex} disabled={isDisabled}
            />
          )}
        </div>
      )}

      {/* Confirm */}
      <button
        disabled={isDisabled}
        onClick={onConfirm}
        className="w-full py-4 rounded-2xl text-white font-black text-lg tracking-wide
          transition-all duration-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl"
        style={{ backgroundColor: hex }}
      >
        ▶ {selectedRunner ? '도루 시도!' : `${BATTING_CMDS.find(c => c.cmd === selectedBatting)?.label ?? ''} 실행`}
      </button>
    </div>
  )
}

function RunnerChip({ label, selected, onClick, color, disabled }: {
  label: string; selected: boolean; onClick: () => void; color: string; disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
        selected ? 'text-white scale-105' : 'border-gray-600 bg-gray-900 text-gray-300 hover:border-gray-500'
      }`}
      style={selected ? { backgroundColor: color + '30', borderColor: color } : {}}
    >
      🏃 {label}
    </button>
  )
}

// ─── Pitching Panel ───────────────────────────────────────────────

interface PitchingPanelProps {
  selected: PitchingCommand
  onChange: (cmd: PitchingCommand) => void
  onConfirm: () => void
  onChangePitcher: () => void
  isDisabled: boolean
  playerColor: TeamColor
  pitcherName: string
  pitcherEra: number
}

const PITCHING_CMDS: { cmd: PitchingCommand; label: string; emoji: string; desc: string }[] = [
  { cmd: 'ATTACK',  label: '정면승부', emoji: '🔥', desc: '공격적 투구' },
  { cmd: 'CAREFUL', label: '신중하게', emoji: '🎯', desc: '볼 위험 줄임' },
  { cmd: 'IBB',     label: '고의사구', emoji: '🚶', desc: '의도적 4구' },
]

export function PitchingCommandPanel({
  selected, onChange, onConfirm, onChangePitcher, isDisabled, playerColor, pitcherName, pitcherEra
}: PitchingPanelProps) {
  const hex = getTeamColorHex(playerColor)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-1.5">
        {PITCHING_CMDS.map(({ cmd, label, emoji, desc }) => {
          const active = selected === cmd
          return (
            <button
              key={cmd}
              disabled={isDisabled}
              onClick={() => onChange(cmd)}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-xs font-bold transition-all
                ${active ? 'scale-105 shadow-lg text-white' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500 active:scale-95'}`}
              style={active ? { backgroundColor: hex + '25', borderColor: hex } : {}}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[11px]">{label}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={onChangePitcher}
        disabled={isDisabled}
        className="w-full py-2 rounded-xl border border-gray-700 bg-gray-900 text-gray-400
          hover:border-gray-500 text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
      >
        🔄 투수교체 — {pitcherName} (ERA {pitcherEra.toFixed(2)})
      </button>

      <button
        disabled={isDisabled}
        onClick={onConfirm}
        className="w-full py-4 rounded-2xl text-white font-black text-lg tracking-wide
          transition-all active:scale-95 disabled:opacity-40 shadow-xl"
        style={{ backgroundColor: hex }}
      >
        ▶ {PITCHING_CMDS.find(c => c.cmd === selected)?.label} 투구
      </button>
    </div>
  )
}
