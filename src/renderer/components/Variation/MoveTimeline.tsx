type MoveEntry = {
  san: string
  fen: string
  index: number
  colour: 'w' | 'b'
  moveNumber: number
}

type Props = {
  moves: MoveEntry[]
  currentIndex: number
  onSelect: (index: number) => void
}

function MoveTimeline({ moves, currentIndex, onSelect }: Props) {
  if (moves.length === 0) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>
        No moves yet — play some moves first.
      </p>
    )
  }

  // Group into pairs
  type Pair = { number: number; white?: MoveEntry; black?: MoveEntry }
  const pairs: Pair[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: moves[i].moveNumber,
      white:  moves[i],
      black:  moves[i + 1],
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '300px',
      overflowY: 'auto',
    }}>
      {/* Start position */}
      <div
        onClick={() => onSelect(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          background: currentIndex === -1 ? 'var(--accent-bg)' : 'transparent',
          border: currentIndex === -1 ? '1.5px solid var(--accent)' : '1.5px solid transparent',
          fontSize: '12px',
          color: currentIndex === -1 ? 'var(--accent-text)' : 'var(--text-muted)',
          fontWeight: currentIndex === -1 ? 600 : 400,
          marginBottom: '4px',
        }}
      >
        Start
      </div>

      {pairs.map(pair => (
        <div
          key={pair.number}
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 1fr',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            {pair.number}.
          </span>

          {/* White move */}
          {pair.white && (
            <button
              onClick={() => onSelect(pair.white!.index)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1.5px solid',
                borderColor: currentIndex === pair.white.index
                  ? 'var(--accent)'
                  : 'transparent',
                background: currentIndex === pair.white.index
                  ? 'var(--accent-bg)'
                  : 'transparent',
                color: currentIndex === pair.white.index
                  ? 'var(--accent-text)'
                  : 'var(--text-secondary)',
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: currentIndex === pair.white.index ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {pair.white.san}
            </button>
          )}

          {/* Black move */}
          {pair.black ? (
            <button
              onClick={() => onSelect(pair.black!.index)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1.5px solid',
                borderColor: currentIndex === pair.black.index
                  ? 'var(--accent)'
                  : 'transparent',
                background: currentIndex === pair.black.index
                  ? 'var(--accent-bg)'
                  : 'transparent',
                color: currentIndex === pair.black.index
                  ? 'var(--accent-text)'
                  : 'var(--text-muted)',
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: currentIndex === pair.black.index ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {pair.black.san}
            </button>
          ) : <span />}
        </div>
      ))}
    </div>
  )
}

export default MoveTimeline
export type { MoveEntry }