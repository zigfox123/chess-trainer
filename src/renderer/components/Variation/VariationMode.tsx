import { useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Square } from 'chess.js'
import MoveTimeline, { MoveEntry } from './MoveTimeline'
import VariationCandidates, { Candidate } from './VariationCandidates'

type Props = {
  mainGameHistory: { san: string; lan: string; fen: string; color: 'w' | 'b'; moveNumber: number }[]
  playerColour: 'white' | 'black'
  onExit: () => void
}

type VariationMove = {
  san: string
  fen: string
  isPlayer: boolean
}

function VariationMode({ mainGameHistory, playerColour, onExit }: Props) {
  // The variation chess instance — completely separate from the main game
  const [varGame] = useState(new Chess())
  const [position, setPosition] = useState('start')
  const [timelineIndex, setTimelineIndex] = useState(-1)
  const [inVariation, setInVariation] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [previewFen, setPreviewFen] = useState<string | null>(null)
  const [waitingForPlayer, setWaitingForPlayer] = useState(false)
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({})
  const [arrows, setArrows] = useState<[Square, Square, string?][]>([])
  const [variationHistory, setVariationHistory] = useState<VariationMove[]>([])

  // Build timeline entries from main game history
  const timelineMoves: MoveEntry[] = mainGameHistory.map((m, i) => ({
    san:        m.san,
    fen:        m.fen,
    index:      i,
    colour:     m.color,
    moveNumber: m.moveNumber,
  }))

  // When timeline position changes, update the board and reset variation state
  function handleTimelineSelect(index: number) {
    setTimelineIndex(index)
    setInVariation(false)
    setVariationHistory([])
    setCandidates([])
    setWaitingForPlayer(false)
    setArrows([])
    setHighlightSquares({})

    // Reset varGame to the selected position
    varGame.reset()
    if (index === -1) {
      setPosition('start')
      return
    }

    // Replay moves up to this index
    for (let i = 0; i <= index; i++) {
      varGame.move(mainGameHistory[i].san)
    }
    setPosition(varGame.fen())
  }

  // Player makes a variation move on the board
  async function onDrop(sourceSquare: string, targetSquare: string): Promise<void> {
    if (loadingCandidates) return
    if (!inVariation && candidates.length > 0) return

    try {
      const move = varGame.move({
        from: sourceSquare,
        to:   targetSquare,
        promotion: 'q',
      })
      if (!move) return

      const newFen = varGame.fen()
      setPosition(newFen)
      setHighlightSquares({
        [sourceSquare]: { background: 'rgba(255, 210, 0, 0.35)' },
        [targetSquare]: { background: 'rgba(255, 210, 0, 0.5)'  },
      })

      const playerMove: VariationMove = { san: move.san, fen: newFen, isPlayer: true }
      setVariationHistory(prev => [...prev, playerMove])
      setInVariation(true)
      setWaitingForPlayer(false)
      setCandidates([])
      setArrows([])

      // Get 3 Stockfish responses
      await fetchCandidates(newFen)
    } catch {
      // illegal move — ignore
    }
  }

  async function fetchCandidates(fen: string) {
    setLoadingCandidates(true)
    setCandidates([])

    try {
      // @ts-ignore
      const topMoves = await window.api.stockfishAnalyse(fen)

      // Convert TopMove to Candidate with SAN notation
      const converted: Candidate[] = topMoves.map((m: any) => {
        const tempChess = new Chess(fen)
        const move = tempChess.move({
          from: m.move.slice(0, 2),
          to:   m.move.slice(2, 4),
          promotion: m.move[4] || undefined,
        })
        return {
          rank:     m.rank,
          move:     m.move,
          san:      move?.san || m.move,
          eval:     m.eval,
          evalType: m.evalType,
          line:     m.line,
        }
      })

      setCandidates(converted)

      // Show arrows for all 3 candidates
      const arrowColours = ['rgb(0, 160, 60)', 'rgb(30, 100, 220)', 'rgb(220, 100, 0)']
      const newArrows: [Square, Square, string?][] = converted.map((c, i) => [
        c.move.slice(0, 2) as Square,
        c.move.slice(2, 4) as Square,
        arrowColours[i],
      ])
      setArrows(newArrows)
    } catch (err) {
      console.error('Candidate fetch error:', err)
    } finally {
      setLoadingCandidates(false)
    }
  }

  // Player picks a Stockfish response
  function handleCandidateSelect(candidate: Candidate) {
    try {
      const move = varGame.move({
        from: candidate.move.slice(0, 2),
        to:   candidate.move.slice(2, 4),
        promotion: candidate.move[4] || 'q',
      })
      if (!move) return

      const newFen = varGame.fen()
      setPosition(newFen)
      setHighlightSquares({
        [candidate.move.slice(0, 2)]: { background: 'rgba(255, 210, 0, 0.35)' },
        [candidate.move.slice(2, 4)]: { background: 'rgba(255, 210, 0, 0.5)'  },
      })

      const stockfishMove: VariationMove = { san: move.san, fen: newFen, isPlayer: false }
      setVariationHistory(prev => [...prev, stockfishMove])
      setCandidates([])
      setArrows([])
      setWaitingForPlayer(true)
    } catch (err) {
      console.error('Candidate select error:', err)
    }
  }

  function handleCandidateHover(fen: string | null) {
    setPreviewFen(fen)
  }

  function handleResetVariation() {
    setInVariation(false)
    setVariationHistory([])
    setCandidates([])
    setArrows([])
    setHighlightSquares({})
    setWaitingForPlayer(false)

    // Reset back to timeline position
    varGame.reset()
    if (timelineIndex === -1) {
      setPosition('start')
      return
    }
    for (let i = 0; i <= timelineIndex; i++) {
      varGame.move(mainGameHistory[i].san)
    }
    setPosition(varGame.fen())
  }

  const displayPosition = previewFen || position

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

      {/* Board column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Status bar */}
        <div style={{
          width: '500px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-text)',
              background: 'var(--accent-bg)',
              padding: '3px 10px',
              borderRadius: '4px',
            }}>
              VARIATION MODE
            </span>
            {inVariation && (
              <button
                onClick={handleResetVariation}
                style={{
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                ↺ Reset variation
              </button>
            )}
          </div>
          <button
            onClick={onExit}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1.5px solid var(--border-strong)',
              background: 'var(--bg)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ✕ Back to game
          </button>
        </div>

        {/* Board */}
        <div style={{ width: '500px', position: 'relative' }}>
          <Chessboard
            position={displayPosition}
            onPieceDrop={(source, target) => {
              onDrop(source, target)
              return true
            }}
            boardOrientation={playerColour}
            arePiecesDraggable={!loadingCandidates && candidates.length === 0}
            customSquareStyles={highlightSquares}
            customArrows={arrows}
          />
        </div>

        {/* Instruction */}
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          {!inVariation && candidates.length === 0 &&
            'Rewind to any move then drag a piece to start a variation'}
          {loadingCandidates &&
            'Stockfish is thinking of responses…'}
          {candidates.length > 0 &&
            'Pick a response for Stockfish to play'}
          {waitingForPlayer && candidates.length === 0 &&
            'Your turn — make your next move'}
        </p>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>

        {/* Candidate responses — shown after player moves */}
        {(candidates.length > 0 || loadingCandidates) && (
          <VariationCandidates
            candidates={candidates}
            currentFen={position}
            onSelect={handleCandidateSelect}
            onHover={handleCandidateHover}
          />
        )}

        {/* Variation line so far */}
        {variationHistory.length > 0 && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid var(--border)',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Variation line
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {variationHistory.map((m, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: m.isPlayer ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontWeight: m.isPlayer ? 600 : 400,
                  }}
                >
                  {m.san}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Move timeline */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            margin: '0 0 10px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Game moves — click to rewind
          </p>
          <MoveTimeline
            moves={timelineMoves}
            currentIndex={timelineIndex}
            onSelect={handleTimelineSelect}
          />
        </div>
      </div>
    </div>
  )
}

export default VariationMode