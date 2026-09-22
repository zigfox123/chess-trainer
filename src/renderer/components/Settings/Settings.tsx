type Theme = 'light' | 'dark' | 'system'

type Props = {
  skillLevel: number
  playerColour: 'white' | 'black'
  explanationDepth: 'brief' | 'detailed'
  theme: Theme
  onSkillChange: (level: number) => void
  onColourChange: (colour: 'white' | 'black') => void
  onDepthChange: (depth: 'brief' | 'detailed') => void
  onThemeChange: (theme: Theme) => void
  onNewGame: () => void
}

function getSkillLabel(level: number) {
  if (level <= 4)  return 'Beginner'
  if (level <= 8)  return 'Casual'
  if (level <= 12) return 'Intermediate'
  if (level <= 16) return 'Advanced'
  return 'Master'
}

function Settings({
  skillLevel,
  playerColour,
  explanationDepth,
  theme,
  onSkillChange,
  onColourChange,
  onDepthChange,
  onThemeChange,
  onNewGame,
}: Props) {
  return (
    <div style={{
      padding: '1rem',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      width: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      border: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Settings</h3>

      {/* Skill Level */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '0.4rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}>
          Engine difficulty — {getSkillLabel(skillLevel)} ({skillLevel})
        </label>
        <input
          type="range"
          min={1}
          max={20}
          value={skillLevel}
          onChange={e => onSkillChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}>
          <span>Beginner</span>
          <span>Master</span>
        </div>
      </div>

      {/* Player Colour */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '0.4rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}>
          Play as
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['white', 'black'] as const).map(colour => (
            <button
              key={colour}
              onClick={() => onColourChange(colour)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: playerColour === colour ? 'var(--accent)' : 'var(--border-strong)',
                background: playerColour === colour ? 'var(--accent-bg)' : 'var(--bg)',
                color: playerColour === colour ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: playerColour === colour ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {colour === 'white' ? '♙' : '♟'} {colour}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Depth */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '0.4rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}>
          Explanation style
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['brief', 'detailed'] as const).map(depth => (
            <button
              key={depth}
              onClick={() => onDepthChange(depth)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: explanationDepth === depth ? 'var(--accent)' : 'var(--border-strong)',
                background: explanationDepth === depth ? 'var(--accent-bg)' : 'var(--bg)',
                color: explanationDepth === depth ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: explanationDepth === depth ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {depth}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>
          {explanationDepth === 'brief'
            ? '2-3 sentences per move'
            : 'Full breakdown including plans and alternatives'}
        </p>
      </div>

      {/* Theme */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '0.4rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}>
          Theme
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {([
            { value: 'light',  label: '☀️ Light'  },
            { value: 'dark',   label: '🌙 Dark'   },
            { value: 'system', label: '⚙️ System' },
          ] as { value: Theme; label: string }[]).map(t => (
            <button
              key={t.value}
              onClick={() => onThemeChange(t.value)}
              style={{
                flex: 1,
                padding: '0.4rem',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: theme === t.value ? 'var(--accent)' : 'var(--border-strong)',
                background: theme === t.value ? 'var(--accent-bg)' : 'var(--bg)',
                color: theme === t.value ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: theme === t.value ? 600 : 400,
                fontSize: '12px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Game */}
      <button
        onClick={onNewGame}
        style={{
          padding: '0.65rem',
          borderRadius: '6px',
          border: 'none',
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        ↺ New Game
      </button>
    </div>
  )
}

export default Settings