type Props = {
  open: boolean
  onClose: () => void
}

type ShortcutGroup = {
  title: string
  shortcuts: { key: string; description: string }[]
}

const groups: ShortcutGroup[] = [
  {
    title: '🎮 Play',
    shortcuts: [
      { key: 'N',       description: 'New game'              },
      { key: 'F',       description: 'Flip board'            },
      { key: 'E',       description: 'Toggle explore mode'   },
      { key: 'U',       description: 'Undo last move'        },
      { key: '← →',    description: 'Navigate variation tree'},
      { key: 'Escape',  description: 'Exit explore mode'     },
    ],
  },
  {
    title: '📋 Game Review',
    shortcuts: [
      { key: '← →',    description: 'Step through moves'    },
      { key: 'Home',    description: 'Jump to start'         },
      { key: 'End',     description: 'Jump to end'           },
    ],
  },
  {
    title: '🌐 Global',
    shortcuts: [
      { key: '?',       description: 'Show this help modal'  },
      { key: 'Escape',  description: 'Close this modal'      },
    ],
  },
]

function ShortcutsModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '480px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
            Keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcut groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {groups.map(group => (
            <div key={group.title}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {group.title}
              </h3>
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                {group.shortcuts.map((s, i) => (
                  <div
                    key={s.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: i < group.shortcuts.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {s.description}
                    </span>
                    <kbd style={{
                      background: 'var(--bg)',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)',
                      boxShadow: '0 1px 0 var(--border-strong)',
                    }}>
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          margin: '1rem 0 0',
        }}>
          Press <kbd style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: '3px',
            padding: '1px 5px',
            fontSize: '11px',
          }}>?</kbd> anytime to show this
        </p>
      </div>
    </div>
  )
}

export default ShortcutsModal