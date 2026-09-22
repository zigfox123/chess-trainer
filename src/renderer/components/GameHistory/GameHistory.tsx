import { useEffect, useState } from 'react'

type SavedGame = {
  id: string
  pgn: string
  result: string
  playedAs: 'white' | 'black'
  skillLevel: number
  date: string
  moveCount: number
}

function getResultLabel(result: string, playedAs: 'white' | 'black') {
  if (result === 'draw') return { label: 'Draw', color: '#888' }
  if (result === playedAs) return { label: 'Win', color: '#2e7d32' }
  return { label: 'Loss', color: '#c62828' }
}

function getSkillLabel(level: number) {
  if (level <= 4)  return 'Beginner'
  if (level <= 8)  return 'Casual'
  if (level <= 12) return 'Intermediate'
  if (level <= 16) return 'Advanced'
  return 'Master'
}

type Props = {
  refreshTrigger: number
}

function GameHistory({ refreshTrigger }: Props) {
  const [games, setGames] = useState<SavedGame[]>([])

  useEffect(() => {
    // @ts-ignore
    window.api.loadGames().then(setGames)
  }, [refreshTrigger])

  async function handleDelete(id: string) {
    // @ts-ignore
    await window.api.deleteGame(id)
    // @ts-ignore
    window.api.loadGames().then(setGames)
  }

  return (
    <div style={{
      width: '300px',
      background: '#f8f8f8',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <h3 style={{ margin: '0 0 0.75rem' }}>
        Game History {games.length > 0 && `(${games.length})`}
      </h3>

      {games.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
          No games saved yet — complete a game to see it here.
        </p>
      ) : (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {games.map(game => {
            const { label, color } = getResultLabel(game.result, game.playedAs)
            return (
              <div
                key={game.id}
                style={{
                  background: '#fff',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  border: '1px solid #eee',
                  fontSize: '13px',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '3px',
                }}>
                  <span style={{ fontWeight: 600, color }}>{label}</span>
                  <span style={{ color: '#aaa', fontSize: '11px' }}>{game.date}</span>
                </div>
                <div style={{
                  color: '#666',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>
                    Played as {game.playedAs} · {getSkillLabel(game.skillLevel)}
                  </span>
                  <span>{game.moveCount} moves</span>
                </div>
                <button
                  onClick={() => handleDelete(game.id)}
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#999',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GameHistory