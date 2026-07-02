'use client'
import type { BaseState, TeamColor } from '@/lib/types'
import { getTeamColorHex } from '@/lib/defaultData'

interface Props {
  bases: BaseState
  outs: number
  playerColor: TeamColor
  isPlayerBatting: boolean
}

export default function BaseballField({ bases, outs, playerColor, isPlayerBatting }: Props) {
  const color = getTeamColorHex(playerColor)
  const runnerColor = isPlayerBatting ? color : '#94a3b8'

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Diamond SVG */}
      <svg viewBox="0 0 220 200" className="w-full max-w-[220px]" aria-label="야구장 다이아몬드">
        {/* Outfield grass */}
        <ellipse cx="110" cy="95" rx="100" ry="90" fill="#166534" />
        {/* Infield dirt */}
        <polygon points="110,20 190,100 110,180 30,100" fill="#a16207" />
        {/* Infield grass overlay */}
        <polygon points="110,48 163,100 110,152 57,100" fill="#15803d" />

        {/* Foul lines */}
        <line x1="110" y1="180" x2="30" y2="100" stroke="#d1fae5" strokeWidth="1" opacity="0.5" />
        <line x1="110" y1="180" x2="190" y2="100" stroke="#d1fae5" strokeWidth="1" opacity="0.5" />

        {/* Base paths */}
        <polygon points="110,20 190,100 110,180 30,100"
          fill="none" stroke="#d1fae5" strokeWidth="1.5" opacity="0.6" />

        {/* Pitcher's mound */}
        <circle cx="110" cy="100" r="8" fill="#92400e" />

        {/* Home plate */}
        <polygon points="110,175 105,182 110,188 115,182" fill="white" />

        {/* 1st base */}
        <rect x="182" y="92" width="16" height="16" rx="2"
          fill={bases.first ? runnerColor : '#92400e'} stroke="white" strokeWidth="1.5" />
        {/* 2nd base */}
        <rect x="102" y="12" width="16" height="16" rx="2"
          fill={bases.second ? runnerColor : '#92400e'} stroke="white" strokeWidth="1.5" />
        {/* 3rd base */}
        <rect x="22" y="92" width="16" height="16" rx="2"
          fill={bases.third ? runnerColor : '#92400e'} stroke="white" strokeWidth="1.5" />

        {/* Runner name labels */}
        {bases.first && (
          <text x="198" y="90" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
            {bases.first.name.slice(-1)}
          </text>
        )}
        {bases.second && (
          <text x="110" y="10" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
            {bases.second.name.slice(-1)}
          </text>
        )}
        {bases.third && (
          <text x="22" y="90" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
            {bases.third.name.slice(-1)}
          </text>
        )}

        {/* Labels */}
        <text x="198" y="116" textAnchor="middle" fontSize="8" fill="#d1fae5" opacity="0.7">1</text>
        <text x="110" y="34" textAnchor="middle" fontSize="8" fill="#d1fae5" opacity="0.7">2</text>
        <text x="22" y="116" textAnchor="middle" fontSize="8" fill="#d1fae5" opacity="0.7">3</text>
      </svg>

      {/* Outs indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">아웃</span>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              i < outs ? 'bg-red-500 border-red-400' : 'bg-transparent border-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
