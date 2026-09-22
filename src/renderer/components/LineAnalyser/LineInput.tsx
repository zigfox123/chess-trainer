import { useState } from 'react'
import { Chess } from 'chess.js'

type Props = {
  onAdd: (moveSequence: string) => void
  disabled: boolean
  maxReached: boolean
}

function validateMoveSequence(input: string): string | null {
  try {
    const chess = new Chess()
    const cleaned = input
      .replace(/\d+\./g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleaned) return 'Enter at least one move'

    const moves = cleaned.split(' ').filter(Boolean)
    for (const move of moves) {
      const result = chess.move(move)
      if (!result) return `Invalid move: ${move}`
    }
    return null
  } catch {
    return 'Invalid move sequence'
  }
}

function LineInput({ onAdd, disabled, maxReached }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    const err = validateMoveSequence(input)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onAdd(input.trim())
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
  }

  if (maxReached) {
    return (
      <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>
        Maximum 3 lines reached. Remove a line to add another.
      </p>
    )
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
        Enter a move sequence (e.g. <code>1.e4 e5 2.Nf3</code>)
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder="1.e4 e5 2.Nf3 Nc6"
          disabled={disabled}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1.5px solid ${error ? '#e53935' : '#ddd'}`,
            fontSize: '13px',
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={disabled || !input.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: disabled || !input.trim() ? '#ddd' : '#4a90d9',
            color: disabled || !input.trim() ? '#999' : '#fff',
            fontWeight: 600,
            fontSize: '13px',
            cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Add
        </button>
      </div>
      {error && (
        <p style={{ fontSize: '12px', color: '#e53935', margin: '4px 0 0' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default LineInput