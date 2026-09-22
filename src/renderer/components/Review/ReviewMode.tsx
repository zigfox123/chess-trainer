import { useState, useEffect, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import ReviewMoveList from './ReviewMoveList'
import MissedOpportunity from './MissedOpportunity'
import {
  ClassifiedMove,
  ReviewSummary,
} from '../../../main/review/MoveClassifier'

type Props = {
  refreshTrigger: number
}

type SavedGame = {
  id: string
  pgn: string
  result: string
  playedAs: 'white' | 'black'
  skillLevel: number
  date: string
  moveCount: number
}

type GameReview = {
  moves: ClassifiedMove[]
  whiteSummary: ReviewSummary
  blackSummary: ReviewSummary
  criticalMoments: number[]
}

function AccuracyBar({
  label,
  summary,
  color,
}: {
  label: string
  summary: ReviewSummary
  color: string
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '1rem',
      flex: 1,
      border: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '18px', color }}>{summary.accuracy}%</span>
      </div>

      <div style={{
        height: '6px',
        background: 'var(--border)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '10px',
      }}>
        <div style={{
          height: '100%',
          width: `${summary.accuracy}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
        {[
          { label: '!!',  count: summary.brilliant,  color: '#1565c0' },
          { label: '!',   count: summary.good,       color: '#2e7d32' },
          { label: 'avg', count: summary.average,    color: '#555555' },
          { label: '?!',  count: summary.inaccuracy, color: '#f57c00' },
          { label: '?',   count: summary.mistake,    color: '#e53935' },
          { label: '??',  count: summary.blunder,    color: '#b71c1c' },
        ].map(item => item.count > 0 && (
          <span key={item.label} style={{ color: item.color, fontWeight: 600 }}>
            {item.label} {item.count}
          </span>
        ))}
        <span style={{ color: 'var(--text-muted)' }}>~{summary.avgCpLoss} cp/move</span>
      </div>
    </div>
  )
}

function ReviewMode({ refreshTrigger }: Props) {
  const [games, setGames] = useState<SavedGame[]>([])
  const [selectedGame, setSelectedGame] = useState<SavedGame | null>(null)
  const [review, setReview] = useState<GameReview | null>(null)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [showBestMove, setShowBestMove] = useState(false)

  useEffect(() => {
    // @ts-ignore
    window.api.loadGames().then(setGames)
  }, [refreshTrigger])

  useEffect(() => {
    // @ts-ignore
    window.api.onReviewProgress((data: { current: number; total: number }) => {
      setProgress(data)
    })
    return () => {
      // @ts-ignore
      window.api.offReviewProgress()
    }
  }, [])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!review) return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setCurrentIndex(i => Math.min(i + 1, review.moves.length - 1))
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setCurrentIndex(i => Math.max(i - 1, -1))
    }
    if (e.key === 'Home') {
      e.preventDefault()
      setCurrentIndex(-1)
    }
    if (e.key === 'End') {
      e.preventDefault()
      setCurrentIndex(review.moves.length - 1)
    }
  }, [review])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  async function handleReview(game: SavedGame) {
    setSelectedGame(game)
    setReview(null)
    setCurrentIndex(-1)
    setLoading(true)
    setProgress({ current: 0, total: 0 })

    try {
      // @ts-ignore
      const result: GameReview = await window.api.reviewGame(game.pgn)
      setReview(result)
      setCurrentIndex(-1)
    } catch (err) {
      console.error('Review error:', err)
    } finally {
      setLoading(false)
    }
  }

  function jumpToCritical(direction: 'next' | 'prev') {
    if (!review) return
    const moments = review.criticalMoments

    if (direction === 'next') {
      const next = moments.find(m => m > currentIndex)
      if (next !== undefined) setCurrentIndex(next)
    } else {
      const prev = [...moments].reverse().find(m => m < currentIndex)
      if (prev !== undefined) setCurrentIndex(prev)
    }
  }

  function jumpToNextMistake(direction: 'next' | 'prev') {
    if (!review) return
    const mistakeQualities = ['inaccuracy', 'mistake', 'blunder']

    if (direction === 'next') {
      const next = review.moves.findIndex(
        (m, i) => i > currentIndex && mistakeQualities.includes(m.quality)
      )
      if (next !== -1) setCurrentIndex(next)
    } else {
      let prev = -1
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (mistakeQualities.includes(review.moves[i].quality)) {
          prev = i
          break
        }
      }
      if (prev !== -1) setCurrentIndex(prev)
    }
  }

  const currentMove  = review?.moves[currentIndex]
  const displayFen   = currentMove
    ? currentMove.fenAfter
    : currentIndex === -1
    ? 'start'
    : review?.moves[review.moves.length - 1].fenAfter ?? 'start'

  const rawEval      = currentMove?.evalAfter ?? 0
  const clampedEval  = Math.max(-600, Math.min(600, rawEval))
  const whitePercent = Math.round(((clampedEval + 600) / 1200) * 100)
  // Best move arrow — shown when toggle is on and current move was a mistake
  const bestMoveArrow: [string, string, string][] =
  showBestMove && currentMove && currentMove.bestMove && currentMove.bestMove.length >= 4
    ? [[
        currentMove.bestMove.slice(0, 2),
        currentMove.bestMove.slice(2, 4),
        'rgb(0, 160, 60)',
      ]]
    : []

  const isMistake = currentMove &&
    ['inaccuracy', 'mistake', 'blunder'].includes(currentMove.quality)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>

      <div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '20px', color: 'var(--text-primary)' }}>
          Game Review
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
          Load a saved game to see move-by-move analysis and coaching.
        </p>
      </div>

      {/* Game selector */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '14px', color: 'var(--text-primary)' }}>
          Select a game
        </h3>
        {games.length === 0 ? (
          <p style={{ color: 'var(--text-faint)', fontSize: '13px', margin: 0 }}>
            No saved games yet — complete a game first.
          </p>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '180px',
            overflowY: 'auto',
          }}>
            {games.map(game => (
              <div
                key={game.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: selectedGame?.id === game.id ? 'var(--accent-bg)' : 'var(--bg)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  border: `1.5px solid ${selectedGame?.id === game.id ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div style={{ fontSize: '13px' }}>
                  <span style={{
                    fontWeight: 600,
                    color: game.result === game.playedAs
                      ? 'var(--green)'
                      : game.result === 'draw'
                      ? 'var(--text-muted)'
                      : 'var(--red)',
                    marginRight: '8px',
                  }}>
                    {game.result === game.playedAs
                      ? 'Win'
                      : game.result === 'draw'
                      ? 'Draw'
                      : 'Loss'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Played as {game.playedAs} · {game.moveCount} moves · {game.date}
                  </span>
                </div>
                <button
                  onClick={() => handleReview(game)}
                  disabled={loading}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading progress */}
      {loading && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            Analysing game… {progress.current} / {progress.total} moves
          </p>
          <div style={{
            height: '6px',
            background: 'var(--border)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: progress.total > 0
                ? `${(progress.current / progress.total) * 100}%`
                : '0%',
              background: 'var(--accent)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Review panel */}
      {review && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Accuracy summary */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <AccuracyBar label="White" summary={review.whiteSummary} color="#555" />
            <AccuracyBar label="Black" summary={review.blackSummary} color="#222" />
          </div>

          {/* Main review area */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

            {/* Board column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Navigation controls */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentIndex(-1)} style={navBtn} title="Start (Home)">⏮</button>
                <button onClick={() => jumpToCritical('prev')} style={navBtn} title="Previous critical moment">⚡←</button>
                <button onClick={() => jumpToNextMistake('prev')} style={navBtn} title="Previous mistake">?←</button>
                <button onClick={() => setCurrentIndex(i => Math.max(i - 1, -1))} style={navBtn} title="Previous move (←)">◀</button>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  minWidth: '80px',
                  textAlign: 'center',
                }}>
                  {currentIndex === -1
                    ? 'Start'
                    : `Move ${currentIndex + 1} / ${review.moves.length}`}
                </span>
                <button onClick={() => setCurrentIndex(i => Math.min(i + 1, review.moves.length - 1))} style={navBtn} title="Next move (→)">▶</button>
                <button onClick={() => jumpToNextMistake('next')} style={navBtn} title="Next mistake">→?</button>
                <button onClick={() => jumpToCritical('next')} style={navBtn} title="Next critical moment">→⚡</button>
                <button onClick={() => setCurrentIndex(review.moves.length - 1)} style={navBtn} title="End (End)">⏭</button>
                <button
                  onClick={() => setShowBestMove(p => !p)}
                  style={{
                    ...navBtn,
                    marginLeft: 'auto',
                    borderColor: showBestMove ? 'var(--green)' : 'var(--border-strong)',
                    background: showBestMove ? 'var(--green-bg)' : 'var(--bg)',
                    color: showBestMove ? 'var(--green)' : 'var(--text-muted)',
                  }}
                  title="Toggle best move arrow"
                >
                  {showBestMove ? '✓ Best move' : 'Best move'}
                </button>
              </div>

              {/* Board with eval bar */}
              <div style={{ display: 'flex', gap: '8px' }}>

                {/* Eval bar */}
                <div style={{
                  width: '12px',
                  height: '480px',
                  background: '#1a1a1a',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${whitePercent}%`,
                    background: '#f0f0f0',
                    transition: 'height 0.4s ease',
                  }} />
                </div>

                <div style={{ position: 'relative' }}>
                  <Chessboard
                    position={displayFen}
                    arePiecesDraggable={false}
                    boardWidth={480}
                    boardOrientation={selectedGame?.playedAs ?? 'white'}
                    customArrows={bestMoveArrow as any}
                  />
                </div>
              </div>

              {/* Current move info */}
              {currentMove && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  padding: '4px 0',
                }}>
                  <span>
                    Move {currentMove.moveNumber}
                    {currentMove.colour === 'w' ? ' (White)' : ' (Black)'}:
                    <strong style={{ marginLeft: '4px' }}>{currentMove.san}</strong>
                    {currentMove.isCritical && (
                      <span style={{ marginLeft: '6px', fontSize: '12px' }} title="Critical moment">⚡</span>
                    )}
                  </span>
                  <span style={{
                    color: currentMove.evalAfter >= 0 ? 'var(--green)' : 'var(--red)',
                    fontWeight: 600,
                  }}>
                    {currentMove.evalAfter > 0 ? '+' : ''}
                    {(currentMove.evalAfter / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: 0 }}>
              <ReviewMoveList
                moves={review.moves}
                currentIndex={currentIndex}
                onSelect={setCurrentIndex}
              />

              {/* Missed opportunity panel */}
              {isMistake && currentMove && (
                <MissedOpportunity
                  key={currentIndex}
                  move={currentMove}
                  playerLevel="intermediate"
                />
              )}

              {/* Good move feedback */}
              {currentMove && currentMove.quality === 'brilliant' && (
                <div style={{
                  background: 'var(--accent-bg)',
                  borderRadius: '8px',
                  padding: '1rem',
                  borderLeft: '3px solid var(--accent)',
                  fontSize: '13px',
                  color: 'var(--accent-text)',
                  fontWeight: 600,
                }}>
                  !! Brilliant move — this was the best continuation in the position.
                </div>
              )}

              {currentMove && currentMove.quality === 'good' && (
                <div style={{
                  background: 'var(--green-bg)',
                  borderRadius: '8px',
                  padding: '1rem',
                  borderLeft: '3px solid var(--green)',
                  fontSize: '13px',
                  color: 'var(--green)',
                }}>
                  ! Good move — within {Math.abs(currentMove.evalDelta)} centipawns of the best line.
                </div>
              )}

              {currentMove && currentMove.quality === 'average' && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '1rem',
                  borderLeft: '3px solid var(--border-strong)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  Average move — maintains the position without significant gain or loss.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: '6px',
  border: '1.5px solid var(--border-strong)',
  background: 'var(--bg)',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  cursor: 'pointer',
}

export default ReviewMode