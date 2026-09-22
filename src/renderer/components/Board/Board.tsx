import { Chessboard } from 'react-chessboard'
import { Chess, Move, Square } from 'chess.js'
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import ExplanationPanel from '../ExplanationPanel/ExplanationPanel'
import CandidateMoves, { TopMove } from '../CandidateMoves/CandidateMoves'
import { BoardHandle } from '../../types'
import VariationMode from '../Variation/VariationMode'

type Props = {
  skillLevel: number
  playerColour: 'white' | 'black'
  explanationDepth: 'brief' | 'detailed'
  onGameSaved: () => void
}

type GameResult = {
  winner: 'white' | 'black' | 'draw'
  reason: string
} | null

type MoveEntry = {
  number: number
  white?: string
  black?: string
}

function getGameResult(game: Chess): GameResult {
  if (!game.isGameOver()) return null
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'black' : 'white'
    return { winner, reason: 'Checkmate' }
  }
  if (game.isStalemate()) return { winner: 'draw', reason: 'Stalemate' }
  if (game.isThreefoldRepetition()) return { winner: 'draw', reason: 'Threefold repetition' }
  if (game.isInsufficientMaterial()) return { winner: 'draw', reason: 'Insufficient material' }
  if (game.isDraw()) return { winner: 'draw', reason: '50-move rule' }
  return { winner: 'draw', reason: 'Game over' }
}

function buildMoveList(history: Move[]): MoveEntry[] {
  const entries: MoveEntry[] = []
  for (let i = 0; i < history.length; i += 2) {
    entries.push({
      number: Math.floor(i / 2) + 1,
      white: history[i]?.san,
      black: history[i + 1]?.san,
    })
  }
  return entries
}

function MoveList({ moves }: { moves: MoveEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves])

  return (
    <div style={{
      width: '300px',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '1rem',
      border: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>Moves</h3>

      {moves.length === 0 && (
        <p style={{ color: 'var(--text-faint)', fontSize: '13px' }}>No moves yet</p>
      )}

      {moves.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 1fr',
          gap: '4px',
          paddingBottom: '4px',
          borderBottom: '2px solid var(--border-strong)',
          marginBottom: '4px',
        }}>
          <span />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>White</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Black</span>
        </div>
      )}

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {moves.map(entry => (
          <div
            key={entry.number}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 1fr',
              gap: '4px',
              padding: '3px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '14px',
            }}
          >
            <span style={{ color: 'var(--text-faint)' }}>{entry.number}.</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{entry.white ?? ''}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{entry.black ?? ''}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function GameOverBanner({
  result,
  playerColour,
  onNewGame,
}: {
  result: GameResult
  playerColour: 'white' | 'black'
  onNewGame: () => void
}) {
  if (!result) return null

  const playerWon = result.winner === playerColour
  const isDraw    = result.winner === 'draw'
  const emoji     = isDraw ? '🤝' : playerWon ? '🏆' : '😔'
  const heading   = isDraw ? 'Draw!' : playerWon ? 'You win!' : 'Stockfish wins!'
  const bgColor   = isDraw ? 'var(--bg-secondary)' : playerWon ? 'var(--green-bg)' : 'var(--red-bg)'
  const textColor = isDraw ? 'var(--text-secondary)' : playerWon ? 'var(--green)' : 'var(--red)'

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      zIndex: 10,
    }}>
      <div style={{
        background: bgColor,
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        minWidth: '220px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{emoji}</div>
        <h2 style={{ margin: '0 0 0.25rem', color: textColor }}>{heading}</h2>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '14px' }}>
          {result.reason}
        </p>
        <button
          onClick={onNewGame}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Play again
        </button>
      </div>
    </div>
  )
}

const Board = forwardRef<BoardHandle, Props>(function Board(
  { skillLevel, playerColour, explanationDepth, onGameSaved },
  ref
) {
  const [game] = useState(new Chess())
  const [position, setPosition] = useState('start')
  const [thinking, setThinking] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [lastMove, setLastMove] = useState('')
  const [playerLastMove, setPlayerLastMove] = useState('')
  const [playerLastFen, setPlayerLastFen] = useState('')
  const [stockfishLastFen, setStockfishLastFen] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult>(null)
  const [moveList, setMoveList] = useState<MoveEntry[]>([])
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({})
  const [canUndo, setCanUndo] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [variationMode, setVariationMode] = useState(false)

  // Explore mode
  const [exploreMode, setExploreMode] = useState(false)
  const [candidateMoves, setCandidateMoves] = useState<TopMove[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<string | null>(null)
  const [exploreFen, setExploreFen] = useState<string>('')
  const [candidateArrows, setCandidateArrows] = useState<[Square, Square, string?][]>([])

  useImperativeHandle(ref, () => ({
    newGame:       handleNewGame,
    flipBoard:     () => setFlipped(p => !p),
    toggleExplore: () => {
      if (exploreMode) {
        exitExploreMode()
      } else if (lastMove && !thinking && !gameResult) {
        handleExplore()
      }
    },
    undoMove: handleUndo,
  }))

  useEffect(() => {
    if (playerColour === 'black') {
      makeStockfishMove()
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape' && exploreMode) exitExploreMode()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [exploreMode])

  function getMainGameHistory() {
    const history = game.history({ verbose: true })
    return history.map((m, i) => ({
      san:        m.san,
      lan:        m.lan,
      fen:        m.after,
      color:      m.color,
      moveNumber: Math.ceil((i + 1) / 2),
    }))
  }

  function refreshMoveList() {
    setMoveList(buildMoveList(game.history({ verbose: true })))
  }

  function updateHighlights(g: Chess, lastUciMove?: string) {
    const highlights: Record<string, React.CSSProperties> = {}

    if (lastUciMove) {
      const from = lastUciMove.slice(0, 2)
      const to   = lastUciMove.slice(2, 4)
      highlights[from] = { background: 'rgba(255, 210, 0, 0.35)' }
      highlights[to]   = { background: 'rgba(255, 210, 0, 0.5)'  }
    }

    if (g.inCheck()) {
      const colour = g.turn()
      const board  = g.board()
      for (const row of board) {
        for (const sq of row) {
          if (sq && sq.type === 'k' && sq.color === colour) {
            highlights[sq.square] = { background: 'rgba(220, 50, 50, 0.6)' }
          }
        }
      }
    }

    setHighlightSquares(highlights)
  }

  async function persistGame(result: GameResult) {
    if (!result || game.history().length === 0) return
    // @ts-ignore
    await window.api.saveGame({
      pgn:        game.pgn(),
      result:     result.winner,
      playedAs:   playerColour,
      skillLevel,
      moveCount:  game.history().length,
    })
    onGameSaved()
  }

  async function makeStockfishMove() {
    setThinking(true)
    setExplanation('')
    setExploreMode(false)
    setCandidateMoves([])
    setCandidateArrows([])

    try {
      // @ts-ignore
      const bestMove = await window.api.stockfishMove(game.fen(), skillLevel)
      const fenBeforeMove = game.fen()

      game.move({
        from: bestMove.slice(0, 2),
        to:   bestMove.slice(2, 4),
        promotion: bestMove[4] || 'q',
      })

      setPosition(game.fen())
      setLastMove(bestMove)
      setStockfishLastFen(fenBeforeMove)
      setCanUndo(true)
      refreshMoveList()
      updateHighlights(game, bestMove)

      const result = getGameResult(game)
      if (result) {
        setGameResult(result)
        await persistGame(result)
        return
      }

      setExploreFen(game.fen())
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setThinking(false)
    }
  }

  async function handleExplainStockfish() {
    if (!lastMove || explaining) return
    setExplaining(true)
    setExplanation('')
    try {
      // @ts-ignore
      const exp = await window.api.getExplanation(
        stockfishLastFen,
        lastMove,
        'beginner',
        explanationDepth
      )
      setExplanation(exp)
    } catch (err) {
      console.error('Explanation error:', err)
    } finally {
      setExplaining(false)
    }
  }

  async function handleExplainPlayer() {
    if (!playerLastMove || explaining) return
    setExplaining(true)
    setExplanation('')
    try {
      // @ts-ignore
      const exp = await window.api.getExplanation(
        playerLastFen,
        playerLastMove,
        'beginner',
        explanationDepth
      )
      setExplanation(exp)
    } catch (err) {
      console.error('Explanation error:', err)
    } finally {
      setExplaining(false)
    }
  }

  async function handleExplore() {
    if (loadingCandidates) return
    setExploreMode(true)
    setLoadingCandidates(true)
    setCandidateMoves([])
    setCandidateArrows([])

    try {
      const fen = game.fen()
      setExploreFen(fen)
      // @ts-ignore
      const moves: TopMove[] = await window.api.stockfishAnalyse(fen)
      setCandidateMoves(moves)

      const arrowColours = ['rgb(0, 160, 60)', 'rgb(30, 100, 220)', 'rgb(220, 100, 0)']
      const arrows: [Square, Square, string?][] = moves.map((m, i) => [
        m.move.slice(0, 2) as Square,
        m.move.slice(2, 4) as Square,
        arrowColours[i] || 'rgb(150, 150, 150)',
      ])
      setCandidateArrows(arrows)
    } catch (err) {
      console.error('Analysis error:', err)
    } finally {
      setLoadingCandidates(false)
    }
  }

  function exitExploreMode() {
    setExploreMode(false)
    setCandidateMoves([])
    setPreviewPosition(null)
    setCandidateArrows([])
  }

  function handleCandidateHover(fen: string | null) {
    setPreviewPosition(fen)
  }

  function handleCandidateSelect(move: TopMove) {
    const highlights: Record<string, React.CSSProperties> = {
      [move.move.slice(0, 2)]: { background: 'rgba(100, 150, 255, 0.4)' },
      [move.move.slice(2, 4)]: { background: 'rgba(100, 150, 255, 0.6)' },
    }
    setHighlightSquares(highlights)
  }

  function handleUndo() {
    if (!canUndo || thinking || explaining || gameResult) return
    game.undo()
    game.undo()
    setPosition(game.fen())
    refreshMoveList()
    updateHighlights(game)
    setExplanation('')
    setLastMove('')
    setPlayerLastMove('')
    setPlayerLastFen('')
    setStockfishLastFen('')
    setExploreMode(false)
    setCandidateMoves([])
    setCandidateArrows([])
    setCanUndo(game.history().length >= 2)
  }

  async function onDrop(sourceSquare: string, targetSquare: string): Promise<void> {
    if (thinking || explaining || gameResult || exploreMode) return

    const fenBeforeDrop = game.fen()

    try {
      const move = game.move({
        from: sourceSquare,
        to:   targetSquare,
        promotion: 'q',
      })
      if (move === null) return
    } catch {
      return
    }

    setPlayerLastMove(sourceSquare + targetSquare)
    setPlayerLastFen(fenBeforeDrop)
    setPosition(game.fen())
    refreshMoveList()
    updateHighlights(game)

    const result = getGameResult(game)
    if (result) {
      setGameResult(result)
      await persistGame(result)
      return
    }

    await makeStockfishMove()
  }

  function handleNewGame() {
    game.reset()
    setPosition('start')
    setGameResult(null)
    setExplanation('')
    setLastMove('')
    setPlayerLastMove('')
    setPlayerLastFen('')
    setStockfishLastFen('')
    setMoveList([])
    setHighlightSquares({})
    setExploreMode(false)
    setCandidateMoves([])
    setPreviewPosition(null)
    setCandidateArrows([])
    setCanUndo(false)
    setFlipped(false)
    setVariationMode(false)
    if (playerColour === 'black') {
      makeStockfishMove()
    }
  }

  const displayPosition = exploreMode && previewPosition
    ? previewPosition
    : position

  const boardOrientation = (playerColour === 'white') !== flipped ? 'white' : 'black'

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {variationMode ? (
        <VariationMode
          mainGameHistory={getMainGameHistory()}
          playerColour={playerColour}
          onExit={() => setVariationMode(false)}
        />
      ) : (
        <>
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {thinking && (
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
                    Stockfish is thinking…
                  </p>
                )}
                {!thinking && !gameResult && !exploreMode && lastMove && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleExplore}
                      disabled={loadingCandidates}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--accent)',
                        background: 'var(--bg)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      🔍 Explore position
                    </button>
                    <button
                      onClick={() => setVariationMode(true)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--accent)',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      🌿 Variation mode
                    </button>
                  </div>
                )}
                {exploreMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--amber)',
                      background: 'var(--amber-bg)',
                      padding: '3px 10px',
                      borderRadius: '4px',
                    }}>
                      EXPLORE MODE
                    </span>
                    <button
                      onClick={exitExploreMode}
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
                )}
                {!thinking && !lastMove && (
                  <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
                    Make your first move
                  </span>
                )}
              </div>

              {/* Undo button */}
              {canUndo && !gameResult && !exploreMode && (
                <button
                  onClick={handleUndo}
                  disabled={thinking || explaining}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-strong)',
                    background: 'var(--bg)',
                    color: thinking || explaining ? 'var(--text-faint)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: thinking || explaining ? 'not-allowed' : 'pointer',
                  }}
                >
                  ↩ Undo
                </button>
              )}
            </div>

            {/* Board */}
            <div style={{ width: '500px', position: 'relative' }}>
              <Chessboard
                position={displayPosition}
                onPieceDrop={(source, target) => {
                  onDrop(source, target)
                  return true
                }}
                boardOrientation={boardOrientation}
                arePiecesDraggable={!thinking && !explaining && !gameResult && !exploreMode}
                customSquareStyles={highlightSquares}
                customArrows={exploreMode ? candidateArrows : []}
              />
              <GameOverBanner
                result={gameResult}
                playerColour={playerColour}
                onNewGame={handleNewGame}
              />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {exploreMode ? (
              <CandidateMoves
                moves={candidateMoves}
                currentFen={exploreFen}
                explanationDepth={explanationDepth}
                onHover={handleCandidateHover}
                onSelect={handleCandidateSelect}
              />
            ) : (
              <>
                <MoveList moves={moveList} />
                <ExplanationPanel
                  explanation={explanation}
                  thinking={explaining}
                  playerMove={playerLastMove}
                  stockfishMove={lastMove}
                  onExplainStockfish={handleExplainStockfish}
                  onExplainPlayer={handleExplainPlayer}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
})

export default Board