import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import LineInput from './LineInput'
import FactorBars from './FactorBars'
import Heatmap from './Heatmap'
import ComparisonSummary from './ComparisonSummary'

type LineAnalysis = {
  moves: string
  fen: string
  eval: number
  evalType: 'cp' | 'mate'
  factors: {
    centerControl: number
    kingSafety: number
    pieceActivity: number
    pawnStructure: number
    spaceAdvantage: number
  }
  complexity: number
}

const RANK_COLORS = ['#1b5e20', '#0d47a1', '#e65100']
const RANK_BG     = ['#e8f5e9', '#e3f2fd', '#fff3e0']

function LineAnalyser() {
  const [lines, setLines] = useState<LineAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [summaries, setSummaries] = useState<string[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [selectedLine, setSelectedLine] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleAddLine(moveSequence: string) {
    setLoading(true)
    setError(null)
    setSummaries([])

    try {
      // @ts-ignore
      const result: LineAnalysis = await window.api.analyseLine(moveSequence)
      if (!result) {
        setError('Could not analyse that move sequence — check it is valid.')
        return
      }
      const updated = [...lines, result]
      setLines(updated)
      setSelectedLine(updated.length - 1)

      // Auto-fetch comparison summary if 2+ lines
      if (updated.length >= 2) {
        fetchSummary(updated)
      }
    } catch (err) {
      setError('Analysis failed — is Stockfish running?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSummary(analyses: LineAnalysis[]) {
    setSummaryLoading(true)
    try {
      // @ts-ignore
      const result: string[] = await window.api.compareLines(analyses, 'intermediate')
      setSummaries(result)
    } catch (err) {
      console.error('Summary error:', err)
    } finally {
      setSummaryLoading(false)
    }
  }

  function handleRemoveLine(index: number) {
    const updated = lines.filter((_, i) => i !== index)
    setLines(updated)
    setSummaries([])
    setSelectedLine(Math.min(selectedLine, updated.length - 1))
    if (updated.length >= 2) {
      fetchSummary(updated)
    }
  }

  const current = lines[selectedLine]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>

      <div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '20px' }}>Line Analyser</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>
          Compare up to 3 opening or middlegame lines side by side.
        </p>
      </div>

      {/* Line input */}
      <div style={{
        background: '#f8f8f8',
        borderRadius: '8px',
        padding: '1rem',
      }}>
        <LineInput
          onAdd={handleAddLine}
          disabled={loading}
          maxReached={lines.length >= 3}
        />
        {loading && (
          <p style={{ fontSize: '13px', color: '#aaa', margin: '8px 0 0', fontStyle: 'italic' }}>
            Running Stockfish analysis…
          </p>
        )}
        {error && (
          <p style={{ fontSize: '13px', color: '#e53935', margin: '8px 0 0' }}>
            {error}
          </p>
        )}
      </div>

      {/* Line tabs */}
      {lines.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setSelectedLine(i)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid',
                  borderColor: selectedLine === i ? RANK_COLORS[i] : '#ddd',
                  background: selectedLine === i ? RANK_BG[i] : '#fff',
                  color: selectedLine === i ? RANK_COLORS[i] : '#555',
                  fontWeight: selectedLine === i ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {line.moves.length > 20 ? line.moves.slice(0, 20) + '…' : line.moves}
              </button>
              <button
                onClick={() => handleRemoveLine(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#bbb',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main analysis panel */}
      {current && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Board + heatmap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 6px' }}>Position</p>
              <Chessboard
                position={current.fen}
                arePiecesDraggable={false}
                boardWidth={280}
              />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 6px' }}>Square control</p>
              <Heatmap fen={current.fen} />
            </div>
          </div>

          {/* Factor bars */}
          <div style={{
            background: '#f8f8f8',
            borderRadius: '8px',
            padding: '1rem',
            minWidth: '260px',
            flex: 1,
          }}>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px' }}>
              Positional factors
            </p>
            <FactorBars
              factors={current.factors}
              complexity={current.complexity}
              eval={current.eval}
              evalType={current.evalType}
            />
          </div>
        </div>
      )}

      {/* AI comparison summary */}
      {(summaryLoading || summaries.length > 0) && (
        <ComparisonSummary
          summaries={summaries}
          lineNames={lines.map(l => l.moves.length > 20 ? l.moves.slice(0, 20) + '…' : l.moves)}
          loading={summaryLoading}
        />
      )}

      {lines.length === 0 && !loading && (
        <div style={{
          background: '#f8f8f8',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          color: '#aaa',
          fontSize: '14px',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '24px' }}>♟</p>
          <p style={{ margin: 0 }}>Add a line above to start analysing</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
            Try: <code>1.e4 e5 2.Nf3</code> or <code>1.d4 d5 2.c4</code>
          </p>
        </div>
      )}
    </div>
  )
}

export default LineAnalyser