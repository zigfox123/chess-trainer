import { useState } from 'react'
import { ClassifiedMove, getQualityColor, getQualityDescription, getQualityBg } from '../../../main/review/MoveClassifier'

type Props = {
  move: ClassifiedMove
  playerLevel: string
}

function MissedOpportunity({ move, playerLevel }: Props) {
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const isNegative = ['inaccuracy', 'mistake', 'blunder'].includes(move.quality)

  async function handleExplain() {
    if (loaded || loading) return
    setLoading(true)
    try {
      // @ts-ignore
      const result = await window.api.getMissedOpportunity(
        move.fenBefore,
        move.san,
        move.bestMove,
        move.evalDelta,
        playerLevel
      )
      setExplanation(result)
      setLoaded(true)
    } catch (err) {
      console.error('Explanation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const color = getQualityColor(move.quality)
  const bg    = getQualityBg(move.quality)
  const desc  = getQualityDescription(move.quality)

  return (
    <div style={{
      background: bg,
      borderRadius: '8px',
      padding: '1rem',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
      }}>
        <div>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color,
          }}>
            {desc}
          </span>
          <span style={{
            fontSize: '13px',
            fontFamily: 'monospace',
            marginLeft: '8px',
            color: '#333',
          }}>
            {move.san}
          </span>
        </div>
        <span style={{
          fontSize: '12px',
          color: '#888',
        }}>
          {move.evalDelta < 0
            ? `${move.evalDelta} cp`
            : `+${move.evalDelta} cp`}
        </span>
      </div>

      {/* Best move suggestion */}
      {isNegative && move.bestMove && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#555' }}>
            Best move was:{' '}
            <span style={{
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#2e7d32',
            }}>
              {move.bestMove.slice(0, 2)}–{move.bestMove.slice(2, 4)}
            </span>
          </span>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <p style={{
          fontSize: '13px',
          color: '#333',
          lineHeight: 1.6,
          margin: '0 0 8px',
        }}>
          {explanation}
        </p>
      )}

      {/* Explain button */}
      {isNegative && !loaded && (
        <button
          onClick={handleExplain}
          disabled={loading}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: `1.5px solid ${color}`,
            background: '#fff',
            color,
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Thinking…' : '💡 Explain mistake'}
        </button>
      )}
    </div>
  )
}

export default MissedOpportunity