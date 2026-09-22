import { useState, useEffect, useCallback, useRef } from 'react'
import Board from './renderer/components/Board/Board'
import Settings from './renderer/components/Settings/Settings'
import GameHistory from './renderer/components/GameHistory/GameHistory'
import LineAnalyser from './renderer/components/LineAnalyser/LineAnalyser'
import ReviewMode from './renderer/components/Review/ReviewMode'
import ProgressDashboard from './renderer/components/Progress/ProgressDashboard'
import RepertoireBuilder from './renderer/components/Repertoire/RepertoireBuilder'
import ShortcutsModal from './renderer/components/UI/ShortcutsModal'
import { useTheme } from './renderer/hooks/useTheme'
import { BoardHandle } from './renderer/types'

type View = 'game' | 'analyser' | 'review' | 'progress' | 'repertoire'

function App() {
  const [view, setView] = useState<View>('game')
  const [skillLevel, setSkillLevel] = useState(5)
  const [playerColour, setPlayerColour] = useState<'white' | 'black'>('white')
  const [explanationDepth, setExplanationDepth] = useState<'brief' | 'detailed'>('brief')
  const [gameKey, setGameKey] = useState(0)
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { theme, setTheme } = useTheme()
  const boardRef = useRef<BoardHandle>(null)

  //throw new Error('Test error boundary works')

  function handleNewGame() {
    setGameKey(prev => prev + 1)
  }

  function handleGameSaved() {
    setHistoryRefresh(prev => prev + 1)
  }

  // Global keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === '?') {
      setShowShortcuts(p => !p)
      return
    }
    if (e.key === 'Escape') {
      setShowShortcuts(false)
      return
    }

    if (view === 'game') {
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleNewGame()
        return
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        boardRef.current?.flipBoard()
        return
      }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        boardRef.current?.toggleExplore()
        return
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault()
        boardRef.current?.undoMove()
        return
      }
    }
  }, [view])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const navItems: { id: View; label: string }[] = [
    { id: 'game',       label: '🎮 Play'         },
    { id: 'analyser',   label: '🔬 Line Analyser' },
    { id: 'review',     label: '📋 Game Review'   },
    { id: 'progress',   label: '📈 Progress'      },
    { id: 'repertoire', label: '📖 Repertoire'    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Shortcuts modal */}
      <ShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Top nav */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 100,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: '16px',
          marginRight: '1rem',
          color: 'var(--text-primary)',
        }}>
          ♟ Chess Trainer
        </span>
        {navItems.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: '5px 16px',
              borderRadius: '6px',
              border: '1.5px solid',
              borderColor: view === v.id ? 'var(--accent)' : 'var(--border-strong)',
              background: view === v.id ? 'var(--accent-bg)' : 'var(--bg)',
              color: view === v.id ? 'var(--accent-text)' : 'var(--text-muted)',
              fontWeight: view === v.id ? 600 : 400,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {v.label}
          </button>
        ))}

        {/* Shortcuts hint button */}
        <button
          onClick={() => setShowShortcuts(true)}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1.5px solid var(--border-strong)',
            background: 'var(--bg)',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
          title="Keyboard shortcuts (?)"
        >
          ⌨️ ?
        </button>
      </div>

      {/* All views rendered but only the active one visible */}
      <div style={{ padding: '1.5rem', background: 'var(--bg)' }}>

        {/* Game view */}
        <div style={{
          display: view === 'game' ? 'flex' : 'none',
          gap: '1.5rem',
          alignItems: 'flex-start',
        }}>
          <Board
            key={gameKey}
            ref={boardRef}
            skillLevel={skillLevel}
            playerColour={playerColour}
            explanationDepth={explanationDepth}
            onGameSaved={handleGameSaved}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Settings
              skillLevel={skillLevel}
              playerColour={playerColour}
              explanationDepth={explanationDepth}
              theme={theme}
              onSkillChange={setSkillLevel}
              onColourChange={colour => {
                setPlayerColour(colour)
                handleNewGame()
              }}
              onDepthChange={setExplanationDepth}
              onThemeChange={setTheme}
              onNewGame={handleNewGame}
            />
            <GameHistory refreshTrigger={historyRefresh} />
          </div>
        </div>

        {/* Line analyser view */}
        <div style={{ display: view === 'analyser' ? 'block' : 'none', maxWidth: '900px' }}>
          <LineAnalyser />
        </div>

        {/* Game review view */}
        <div style={{ display: view === 'review' ? 'block' : 'none', maxWidth: '1100px' }}>
          <ReviewMode refreshTrigger={historyRefresh} />
        </div>

        {/* Progress view */}
        <div style={{ display: view === 'progress' ? 'block' : 'none', maxWidth: '900px' }}>
          <ProgressDashboard refreshTrigger={historyRefresh} />
        </div>

        {/* Repertoire view */}
        <div style={{ display: view === 'repertoire' ? 'block' : 'none', maxWidth: '1000px' }}>
          <RepertoireBuilder />
        </div>

      </div>
    </div>
  )
}

export default App