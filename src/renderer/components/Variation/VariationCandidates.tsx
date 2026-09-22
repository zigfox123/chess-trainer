import { Chess } from 'chess.js'

export type Candidate = {
  rank: number
  move: string       // UCI
  san: string        // algebraic
  eval: number
  evalType: 'cp' | 'mate'
  line: string[]
}

type Props = {
  candidates: Candidate[]
  currentFen: string
  onSelect: (candidate: Candidate) => void
  onHover: (fen: string | null) => void
}

function formatEval(candidate: Candidate): string {
  if (candidate.evalType === 'mate') {
    return candidate.eval > 0 ? `M${candidate.eval}` : `-M${Math.abs(candidate.eval)}`
  }
  const pawns = candidate.eval / 100
  return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2)
}

function getRankStyle(rank: number): { label: string; bg: string; color: string } {
  if (rank === 1) return { label: 'Option A', bg: 'var(--green-bg)',   color: 'var(--green)'  }
  if (rank === 2) return { label: 'Option B', bg: 'var(--accent-bg)', color: 'var(--accent)' }
  return              { label: 'Option C', bg: 'var(--amber-bg)',  color: 'var(--amber)'  }
}

function fenAfterMove(fen: string, uciMove: string): string | null {
  try {
    const chess = new Chess(fen)
    chess.move({
      from: uciMove.slice(0, 2),
      to:   uciMove.slice(2, 4),
      promotion: uciMove[4] || undefined,
    })
    return chess.fen()
  } catch {
    return null
  }
}

function lineToSan(fen: string, uciMoves: string[]): string {
  try {
    const chess = new Chess(fen)
    const sans: string[] = []
    for (const uci of uciMoves.slice(0, 5)) {
      const move = chess.move({
        from: uci.slice(0, 2),
        to:   uci.slice(2, 4),
        promotion: uci[4] || undefined,
      })
      if (!move) break
      sans.push(move.san)
    }
    return sans.join(' ')
  } catch {
    return ''
  }
}

function VariationCandidates({ candidates, currentFen, onSelect, onHover }: Props) {
  if (candidates.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0, fontStyle: 'italic' }}>
          Stockfish is thinking of responses…
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '1rem',
      border: '1px solid var(--border)',
    }}>
      <p style={{
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        margin: '0 0 10px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        Pick Stockfish's response
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {candidates.map(candidate => {
          const { label, bg, color } = getRankStyle(candidate.rank)
          const sanLine = lineToSan(currentFen, candidate.line)

          return (
            <div
              key={candidate.rank}
              onMouseEnter={() => {
                const fen = fenAfterMove(currentFen, candidate.move)
                onHover(fen)
              }}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(candidate)}
              style={{
                background: bg,
                borderRadius: '8px',
                padding: '10px 12px',
                border: `1.5px solid ${color}`,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}>
                    {candidate.san}
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color }}>
                  {formatEval(candidate)}
                </span>
              </div>

              {sanLine && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {sanLine}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VariationCandidates