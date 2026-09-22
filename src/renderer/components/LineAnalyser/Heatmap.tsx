import { Chess } from 'chess.js'

type Props = {
  fen: string
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function Heatmap({ fen }: Props) {
  const chess = new Chess(fen)
  const board = chess.board()

  // Compute net control per square
  // Positive = white controls, negative = black controls
  function getControl(row: number, col: number): number {
    const file = FILES[col]
    const rank = 8 - row
    const square = `${file}${rank}` as any

    const whiteAttackers = chess.attackers(square, 'w').length
    const blackAttackers = chess.attackers(square, 'b').length
    return whiteAttackers - blackAttackers
  }

  function getSquareColor(control: number, isLight: boolean): string {
    const baseLight = '#f0d9b5'
    const baseDark  = '#b58863'

    if (control > 0) {
      // White controls — green tint
      const intensity = Math.min(control / 3, 1)
      return `rgba(46, 125, 50, ${intensity * 0.55})`
    }
    if (control < 0) {
      // Black controls — red tint
      const intensity = Math.min(Math.abs(control) / 3, 1)
      return `rgba(198, 40, 40, ${intensity * 0.55})`
    }
    // Contested or neutral
    return isLight ? baseLight : baseDark
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        width: '240px',
        height: '240px',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #ddd',
      }}>
        {board.map((row, r) =>
          row.map((sq, c) => {
            const isLight = (r + c) % 2 === 0
            const control = getControl(r, c)
            const bg = getSquareColor(control, isLight)
            const base = isLight ? '#f0d9b5' : '#b58863'

            return (
              <div
                key={`${r}-${c}`}
                style={{
                  background: base,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  position: 'relative',
                }}
              >
                {/* Colour overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: bg,
                }} />
                {/* Piece */}
                {sq && (
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {getPieceSymbol(sq.type, sq.color)}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(46, 125, 50, 0.55)' }} />
          <span style={{ fontSize: '11px', color: '#666' }}>White</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(198, 40, 40, 0.55)' }} />
          <span style={{ fontSize: '11px', color: '#666' }}>Black</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f0d9b5', border: '1px solid #ddd' }} />
          <span style={{ fontSize: '11px', color: '#666' }}>Neutral</span>
        </div>
      </div>
    </div>
  )
}

function getPieceSymbol(type: string, color: string): string {
  const symbols: Record<string, Record<string, string>> = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  }
  return symbols[color]?.[type] ?? ''
}

export default Heatmap