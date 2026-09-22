type Props = {
  explanation: string
  thinking: boolean
  playerMove: string
  stockfishMove: string
  onExplainStockfish: () => void
  onExplainPlayer: () => void
}

function ExplanationPanel({
  explanation,
  thinking,
  playerMove,
  stockfishMove,
  onExplainStockfish,
  onExplainPlayer,
}: Props) {
  return (
    <div style={{
      padding: '1rem',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      width: '300px',
      minHeight: '150px',
      border: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>Coach</h3>

      {/* Explain buttons */}
      {(playerMove || stockfishMove) && !thinking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {stockfishMove && (
            <button
              onClick={onExplainStockfish}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1.5px solid var(--accent)',
                background: 'var(--bg)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              💡 Explain Stockfish's move
              <span style={{
                fontFamily: 'monospace',
                marginLeft: '6px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}>
                {stockfishMove.slice(0, 2)}–{stockfishMove.slice(2, 4)}
              </span>
            </button>
          )}
          {playerMove && (
            <button
              onClick={onExplainPlayer}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1.5px solid var(--border-strong)',
                background: 'var(--bg)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              💡 Explain my move
              <span style={{
                fontFamily: 'monospace',
                marginLeft: '6px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}>
                {playerMove.slice(0, 2)}–{playerMove.slice(2, 4)}
              </span>
            </button>
          )}
        </div>
      )}

      {/* No moves yet */}
      {!playerMove && !stockfishMove && !thinking && (
        <p style={{ color: 'var(--text-faint)', fontSize: '13px', margin: 0 }}>
          Make your first move to start.
        </p>
      )}

      {/* Loading */}
      {thinking && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
          Thinking…
        </p>
      )}

      {/* Explanation text */}
      {!thinking && explanation && (
        <p style={{
          lineHeight: 1.6,
          fontSize: '13px',
          color: 'var(--text-secondary)',
          margin: 0,
        }}>
          {explanation}
        </p>
      )}
    </div>
  )
}

export default ExplanationPanel