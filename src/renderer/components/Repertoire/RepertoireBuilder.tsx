import { useState, useEffect, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'

type RepertoireLine = {
  id: string
  name: string
  moves: string
  colour: 'white' | 'black'
  notes: string
  createdAt: string
}

function validateMoveSequence(input: string): string | null {
  if (!input.trim()) return null
  try {
    const chess = new Chess()
    const cleaned = input
      .replace(/\d+\./g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!cleaned) return null
    for (const move of cleaned.split(' ').filter(Boolean)) {
      if (!chess.move(move)) return `Invalid move: ${move}`
    }
    return null
  } catch {
    return 'Invalid move sequence'
  }
}

function getFenFromMoves(moves: string): string {
  if (!moves.trim()) return 'start'
  try {
    const chess = new Chess()
    const cleaned = moves
      .replace(/\d+\./g, '')
      .replace(/\s+/g, ' ')
      .trim()
    for (const move of cleaned.split(' ').filter(Boolean)) {
      if (!chess.move(move)) break
    }
    return chess.fen()
  } catch {
    return 'start'
  }
}

export function checkRepertoireDeviation(
  gameMoves: string[],
  repertoire: RepertoireLine[],
  colour: 'white' | 'black'
): { line: RepertoireLine; deviationAt: number } | null {
  const relevantLines = repertoire.filter(l => l.colour === colour)

  for (const line of relevantLines) {
    try {
      const chess = new Chess()
      const repMoves = line.moves
        .replace(/\d+\./g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)

      let matched = 0
      for (let i = 0; i < Math.min(gameMoves.length, repMoves.length); i++) {
        const gameMove = chess.move(gameMoves[i])
        if (!gameMove) break

        const repChess = new Chess()
        for (let j = 0; j < i; j++) repChess.move(repMoves[j])
        const repMove = repChess.move(repMoves[i])

        if (gameMove.san === repMove?.san) {
          matched++
        } else if (matched > 0) {
          return { line, deviationAt: i }
        } else {
          break
        }
      }
    } catch {
      continue
    }
  }
  return null
}

function RepertoireBuilder() {
  const [lines, setLines] = useState<RepertoireLine[]>([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [moves, setMoves] = useState('')
  const [colour, setColour] = useState<'white' | 'black'>('white')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Board preview — initialise to 'start' and only update when moves are valid
  const [previewFen, setPreviewFen] = useState('start')

  useEffect(() => {
    loadLines()
  }, [])

  // Debounced board preview update — only update after user stops typing
  const updatePreview = useCallback((value: string) => {
    if (!value.trim()) {
      setPreviewFen('start')
      return
    }
    // Only update the board if the moves are valid so far
    // We parse incrementally — show as far as we can get
    try {
      const chess = new Chess()
      const cleaned = value
        .replace(/\d+\./g, '')
        .replace(/\s+/g, ' ')
        .trim()
      const moveList = cleaned.split(' ').filter(Boolean)
      for (const move of moveList) {
        const result = chess.move(move)
        if (!result) break // stop at first invalid move but keep what we have
      }
      setPreviewFen(chess.fen())
    } catch {
      // Don't reset the board on error — keep the last valid position
    }
  }, [])

  async function loadLines() {
    // @ts-ignore
    const loaded = await window.api.loadRepertoire()
    setLines(loaded)
  }

  function resetForm() {
    setName('')
    setMoves('')
    setColour('white')
    setNotes('')
    setFormError(null)
    setPreviewFen('start')
  }

  function handleMovesChange(value: string) {
    setMoves(value)

    // Validate inline as user types
    if (value.trim()) {
      const err = validateMoveSequence(value)
      setFormError(err)
    } else {
      setFormError(null)
    }

    // Update board preview progressively
    updatePreview(value)
  }

  async function handleSave() {
    if (!name.trim()) {
      setFormError('Enter a name for this line')
      return
    }

    // Full validation on save
    const err = validateMoveSequence(moves)
    if (err) {
      setFormError(err)
      return
    }

    if (!moves.trim()) {
      setFormError('Enter at least one move')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        // @ts-ignore
        await window.api.updateRepertoireLine(editing, { name, moves, notes })
      } else {
        // @ts-ignore
        await window.api.saveRepertoireLine({ name, moves, colour, notes })
      }
      await loadLines()
      resetForm()
      setAdding(false)
      setEditing(null)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    // @ts-ignore
    await window.api.deleteRepertoireLine(id)
    await loadLines()
  }

  function handleEdit(line: RepertoireLine) {
    setEditing(line.id)
    setName(line.name)
    setMoves(line.moves)
    setColour(line.colour)
    setNotes(line.notes)
    setPreviewFen(getFenFromMoves(line.moves))
    setAdding(true)
  }

  function handleCancel() {
    resetForm()
    setAdding(false)
    setEditing(null)
  }

  const whiteLines = lines.filter(l => l.colour === 'white')
  const blackLines = lines.filter(l => l.colour === 'black')

  function LineCard({ line }: { line: RepertoireLine }) {
    const [showBoard, setShowBoard] = useState(false)

    return (
      <div style={{
        background: 'var(--bg)',
        borderRadius: '8px',
        padding: '12px 14px',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '6px',
        }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {line.name}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '8px' }}>
              {line.createdAt}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowBoard(p => !p)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {showBoard ? 'Hide' : 'Board'}
            </button>
            <button
              onClick={() => handleEdit(line)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(line.id)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--red-bg)',
                background: 'var(--bg)',
                color: 'var(--red)',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <p style={{
          fontSize: '13px',
          fontFamily: 'monospace',
          color: 'var(--text-muted)',
          margin: '0 0 4px',
          wordBreak: 'break-all',
        }}>
          {line.moves}
        </p>

        {line.notes && (
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '4px 0 0',
            fontStyle: 'italic',
          }}>
            {line.notes}
          </p>
        )}

        {showBoard && (
          <div style={{ marginTop: '10px' }}>
            <Chessboard
              position={getFenFromMoves(line.moves)}
              arePiecesDraggable={false}
              boardWidth={220}
              boardOrientation={line.colour}
            />
          </div>
        )}
      </div>
    )
  }

  function ColourSection({
    title,
    emoji,
    sectionLines,
  }: {
    title: string
    emoji: string
    sectionLines: RepertoireLine[]
  }) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '1rem',
        flex: 1,
        minWidth: '300px',
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '14px', color: 'var(--text-primary)' }}>
          {emoji} {title} ({sectionLines.length})
        </h3>
        {sectionLines.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>
            No lines saved yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sectionLines.map(line => (
              <LineCard key={line.id} line={line} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '20px', color: 'var(--text-primary)' }}>
            Opening Repertoire
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            Save your preferred lines. The app will alert you during a game when your opponent deviates.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Add line
          </button>
        )}
      </div>

      {/* Add / edit form */}
      {adding && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '1.25rem',
          border: '1.5px solid var(--accent)',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '15px', color: 'var(--text-primary)' }}>
            {editing ? 'Edit line' : 'Add new line'}
          </h3>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: '260px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>

              {/* Name */}
              <div>
                <label style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '4px',
                }}>
                  Line name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sicilian Najdorf"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-strong)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Colour */}
              {!editing && (
                <div>
                  <label style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '4px',
                  }}>
                    Play as
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['white', 'black'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setColour(c)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1.5px solid',
                          borderColor: colour === c ? 'var(--accent)' : 'var(--border-strong)',
                          background: colour === c ? 'var(--accent-bg)' : 'var(--bg)',
                          color: colour === c ? 'var(--accent-text)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: colour === c ? 600 : 400,
                          fontSize: '13px',
                          textTransform: 'capitalize',
                        }}
                      >
                        {c === 'white' ? '♙' : '♟'} {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Moves */}
              <div>
                <label style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '4px',
                }}>
                  Move sequence
                </label>
                <input
                  type="text"
                  value={moves}
                  onChange={e => handleMovesChange(e.target.value)}
                  placeholder="1.e4 e5 2.Nf3 Nc6 3.Bb5"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1.5px solid ${formError ? 'var(--red)' : 'var(--border-strong)'}`,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                  }}
                />
                {formError && (
                  <p style={{ fontSize: '12px', color: 'var(--red)', margin: '4px 0 0' }}>
                    {formError}
                  </p>
                )}
                {!formError && moves.trim() && (
                  <p style={{ fontSize: '12px', color: 'var(--green)', margin: '4px 0 0' }}>
                    ✓ Valid move sequence
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '4px',
                }}>
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Key ideas, plans, things to remember..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-strong)',
                    fontSize: '13px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !!formError}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: saving || formError ? 'var(--border-strong)' : 'var(--accent)',
                    color: saving || formError ? 'var(--text-muted)' : '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: saving || formError ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add line'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-strong)',
                    background: 'var(--bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Board preview */}
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px' }}>
                Position preview
              </p>
              <Chessboard
                position={previewFen}
                arePiecesDraggable={false}
                boardWidth={220}
                boardOrientation={colour}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lines display */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <ColourSection title="White repertoire" emoji="♙" sectionLines={whiteLines} />
        <ColourSection title="Black repertoire" emoji="♟" sectionLines={blackLines} />
      </div>

      {lines.length === 0 && !adding && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-faint)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '24px', margin: '0 0 8px' }}>📖</p>
          <p style={{ margin: '0 0 4px', fontSize: '14px' }}>No repertoire lines saved yet.</p>
          <p style={{ margin: 0, fontSize: '12px' }}>
            Click <strong>+ Add line</strong> to save your first opening.
          </p>
        </div>
      )}
    </div>
  )
}

export default RepertoireBuilder