import { ClassifiedMove, getQualityColor, getQualityLabel, getQualityBg } from '../../../main/review/MoveClassifier'

type Props = {
  moves: ClassifiedMove[]
  currentIndex: number
  onSelect: (index: number) => void
}

function ReviewMoveList({ moves, currentIndex, onSelect }: Props) {
  // Group into pairs for display
  type MoveEntry = {
    number: number
    whiteIndex: number
    blackIndex: number | null
  }

  const pairs: MoveEntry[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: moves[i].moveNumber,
      whiteIndex: i,
      blackIndex: i + 1 < moves.length ? i + 1 : null,
    })
  }

  function MoveChip({
    move,
    index,
  }: {
    move: ClassifiedMove
    index: number
  }) {
    const isSelected = index === currentIndex
    const label = getQualityLabel(move.quality)
    const color = getQualityColor(move.quality)
    const bg = getQualityBg(move.quality)

    return (
      <button
        onClick={() => onSelect(index)}
        style={{
          padding: '3px 8px',
          borderRadius: '4px',
          border: isSelected ? `2px solid ${color}` : '2px solid transparent',
          background: isSelected ? bg : 'transparent',
          color: isSelected ? color : '#333',
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: isSelected ? 700 : 400,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          transition: 'all 0.1s',
        }}
      >
        {move.san}
        {label && (
          <span style={{ color, fontSize: '11px', fontWeight: 700 }}>
            {label}
          </span>
        )}
        {move.isCritical && (
          <span style={{ fontSize: '10px' }}>⚡</span>
        )}
      </button>
    )
  }

  return (
    <div style={{
      width: '280px',
      background: '#f8f8f8',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <h3 style={{ margin: '0 0 0.75rem' }}>Moves</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {pairs.map(pair => (
          <div
            key={pair.number}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 1fr',
              gap: '4px',
              alignItems: 'center',
              marginBottom: '2px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#aaa' }}>
              {pair.number}.
            </span>
            <MoveChip
              move={moves[pair.whiteIndex]}
              index={pair.whiteIndex}
            />
            {pair.blackIndex !== null && (
              <MoveChip
                move={moves[pair.blackIndex]}
                index={pair.blackIndex}
              />
            )}
          </div>
        ))}
      </div>

      {/* Quality legend */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #eee',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
      }}>
        {[
          { label: '!! Brilliant', color: '#1565c0' },
          { label: '! Good',       color: '#2e7d32' },
          { label: 'avg Average', color:  '#555555' },
          { label: '?! Inaccuracy',color: '#f57c00' },
          { label: '? Mistake',    color: '#e53935' },
          { label: '?? Blunder',   color: '#b71c1c' },
        ].map(item => (
          <span key={item.label} style={{
            fontSize: '10px',
            color: item.color,
            fontWeight: 600,
          }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default ReviewMoveList