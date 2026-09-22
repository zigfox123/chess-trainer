import { useState } from 'react'
import { Chess } from 'chess.js'

export type TopMove = {
  rank: number
  move: string
  eval: number
  evalType: 'cp' | 'mate'
  line: string[]
}

type Props = {
  moves: TopMove[]
  currentFen: string
  explanationDepth: 'brief' | 'detailed'
  onHover: (fen: string | null) => void
  onSelect: (move: TopMove) => void
}

function formatEval(move: TopMove): string {
  if (move.evalType === 'mate') {
    return move.eval > 0 ? `M${move.eval}` : `-M${Math.abs(move.eval)}`
  }
  const pawns = move.eval / 100
  return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2)
}

function getEvalColor(move: TopMove, rank: number): string {
  if (move.evalType === 'mate') return move.eval > 0 ? '#1b5e20' : '#b71c1c'
  if (rank === 1) return '#1b5e20'
  if (rank === 2) return '#0d47a1'
  return '#e65100'
}

function getRankLabel(rank: number): { label: string; bg: string; color: string } {
  if (rank === 1) return { label: 'Best',   bg: '#e8f5e9', color: '#1b5e20' }
  if (rank === 2) return { label: 'Alt',    bg: '#e3f2fd', color: '#0d47a1' }
  return              { label: 'Risky',  bg: '#fff3e0', color: '#e65100' }
}

// Convert UCI move line to SAN notation for display
function lineToSan(fen: string, uciMoves: string[]): string {
  try {
    const chess = new Chess(fen)
    const sanMoves: string[] = []
    for (const uci of uciMoves.slice(0, 6)) {
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] || undefined,
      })
      if (!move) break
      sanMoves.push(move.san)
    }
    return sanMoves.join(' ')
  } catch {
    return uciMoves.slice(0, 6).join(' ')
  }
}

// Get the FEN after applying a UCI move
function fenAfterMove(fen: string, uciMove: string): string | null {
  try {
    const chess = new Chess(fen)
    chess.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
      promotion: uciMove[4] || undefined,
    })
    return chess.fen()
  } catch {
    return null
  }
}

function CandidateMoves({ moves, currentFen, explanationDepth, onHover, onSelect }: Props) {
  const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null)
  const [explanations, setExplanations] = useState<Record<number, string>>({})

  async function handleSelect(move: TopMove) {
    onSelect(move)

    // Only fetch if we don't already have it cached
    if (explanations[move.rank]) return

    setLoadingExplanation(move.rank)
    try {
      // @ts-ignore
      const exp = await window.api.getExplanation(
        currentFen,
        move.move,
        'intermediate',
        explanationDepth
      )
      setExplanations(prev => ({ ...prev, [move.rank]: exp }))
    } catch (err) {
      console.error('Explanation error:', err)
    } finally {
      setLoadingExplanation(null)
    }
  }

  function handleHover(move: TopMove) {
    const fen = fenAfterMove(currentFen, move.move)
    onHover(fen)
  }

  if (moves.length === 0) {
    return (
      <div style={{
        width: '300px',
        background: '#f8f8f8',
        borderRadius: '8px',
        padding: '1rem',
      }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>Candidate Moves</h3>
        <p style={{ color: '#aaa', fontSize: '13px' }}>Analysing position…</p>
      </div>
    )
  }

  return (
    <div style={{
      width: '300px',
      background: '#f8f8f8',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <h3 style={{ margin: '0 0 0.75rem' }}>Candidate Moves</h3>
      <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 0.75rem' }}>
        Hover to preview · Click for AI explanation
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {moves.map(move => {
          const { label, bg, color } = getRankLabel(move.rank)
          const sanLine = lineToSan(currentFen, move.line)
          const evalColor = getEvalColor(move, move.rank)
          const isSelected = loadingExplanation === move.rank || explanations[move.rank]

          return (
            <div
              key={move.rank}
              onMouseEnter={() => handleHover(move)}
              onMouseLeave={() => onHover(null)}
              onClick={() => handleSelect(move)}
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '10px 12px',
                border: `2px solid ${isSelected ? color : '#eee'}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: isSelected ? `0 0 0 3px ${bg}` : 'none',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: bg,
                    color,
                  }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '15px' }}>
                    {move.move.slice(0, 2)}–{move.move.slice(2, 4)}
                  </span>
                </div>
                <span style={{ fontWeight: 600, fontSize: '14px', color: evalColor }}>
                  {formatEval(move)}
                </span>
              </div>

              {/* Continuation line */}
              <div style={{
                fontSize: '12px',
                color: '#888',
                fontFamily: 'monospace',
                marginBottom: explanations[move.rank] ? '8px' : 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {sanLine}
              </div>

              {/* Explanation */}
              {loadingExplanation === move.rank && (
                <p style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic', margin: 0 }}>
                  Thinking…
                </p>
              )}
              {explanations[move.rank] && (
                <p style={{ fontSize: '12px', color: '#444', lineHeight: 1.55, margin: 0 }}>
                  {explanations[move.rank]}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CandidateMoves