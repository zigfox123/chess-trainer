import { useState, useEffect } from 'react'

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
  moves: any[]
  whiteSummary: {
    accuracy: number
    avgCpLoss: number
    brilliant: number
    good: number
    average: number
    inaccuracy: number
    mistake: number
    blunder: number
  }
  blackSummary: {
    accuracy: number
    avgCpLoss: number
    brilliant: number
    good: number
    average: number
    inaccuracy: number
    mistake: number
    blunder: number
  }
}

type GameStat = {
  id: string
  date: string
  result: string
  playedAs: 'white' | 'black'
  skillLevel: number
  moveCount: number
  accuracy?: number
  avgCpLoss?: number
  brilliant?: number
  good?: number
  average?: number
  inaccuracy?: number
  mistake?: number
  blunder?: number
}

function getSkillLabel(level: number) {
  if (level <= 4)  return 'Beginner'
  if (level <= 8)  return 'Casual'
  if (level <= 12) return 'Intermediate'
  if (level <= 16) return 'Advanced'
  return 'Master'
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      padding: '1rem',
      flex: 1,
      minWidth: '120px',
      border: '1px solid var(--border)',
    }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px' }}>{label}</p>
      <p style={{
        fontSize: '22px',
        fontWeight: 700,
        color: color || 'var(--text-primary)',
        margin: '0 0 2px',
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>{sub}</p>
      )}
    </div>
  )
}

function AccuracyChart({ stats }: { stats: GameStat[] }) {
  const withAccuracy = stats.filter(s => s.accuracy !== undefined)
  if (withAccuracy.length < 2) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--text-faint)', textAlign: 'center', padding: '2rem 0' }}>
        Review at least 2 games to see your accuracy trend.
      </p>
    )
  }

  const width  = 500
  const height = 160
  const padL   = 40
  const padR   = 20
  const padT   = 10
  const padB   = 30
  const chartW = width - padL - padR
  const chartH = height - padT - padB

  const accuracies = withAccuracy.map(s => s.accuracy!)
  const minAcc = Math.max(0,   Math.min(...accuracies) - 10)
  const maxAcc = Math.min(100, Math.max(...accuracies) + 10)

  const points = withAccuracy.map((s, i) => {
    const x = padL + (i / (withAccuracy.length - 1)) * chartW
    const y = padT + chartH - ((s.accuracy! - minAcc) / (maxAcc - minAcc)) * chartH
    return { x, y, stat: s }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const yLabels = [minAcc, Math.round((minAcc + maxAcc) / 2), maxAcc]

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {yLabels.map(label => {
        const y = padT + chartH - ((label - minAcc) / (maxAcc - minAcc)) * chartH
        return (
          <g key={label}>
            <line
              x1={padL} y1={y} x2={padL + chartW} y2={y}
              stroke="var(--border)" strokeWidth={1}
            />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
              {label}%
            </text>
          </g>
        )
      })}

      <path
        d={pathD}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <path
        d={`${pathD} L ${points[points.length - 1].x} ${padT + chartH} L ${points[0].x} ${padT + chartH} Z`}
        fill="rgba(74, 144, 217, 0.1)"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            fill={
              p.stat.result === p.stat.playedAs
                ? 'var(--green)'
                : p.stat.result === 'draw'
                ? 'var(--text-muted)'
                : 'var(--red)'
            }
            stroke="var(--bg)"
            strokeWidth={1.5}
          />
        </g>
      ))}

      {points.map((p, i) => (
        (i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
          <text
            key={i}
            x={p.x}
            y={height - 4}
            textAnchor="middle"
            fontSize={9}
            fill="var(--text-muted)"
          >
            {p.stat.date}
          </text>
        )
      ))}
    </svg>
  )
}

function MoveQualityBar({ stats }: { stats: GameStat[] }) {
  const withData = stats.filter(s => s.accuracy !== undefined)
  if (withData.length === 0) return null

  const totals = {
    brilliant:  withData.reduce((s, g) => s + (g.brilliant  || 0), 0),
    good:       withData.reduce((s, g) => s + (g.good       || 0), 0),
    average:    withData.reduce((s, g) => s + (g.average    || 0), 0),
    inaccuracy: withData.reduce((s, g) => s + (g.inaccuracy || 0), 0),
    mistake:    withData.reduce((s, g) => s + (g.mistake    || 0), 0),
    blunder:    withData.reduce((s, g) => s + (g.blunder    || 0), 0),
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  const segments = [
    { key: 'brilliant',  label: '!!',  color: '#1565c0', count: totals.brilliant  },
    { key: 'good',       label: '!',   color: '#2e7d32', count: totals.good       },
    { key: 'average',    label: 'avg', color: '#555555', count: totals.average    },
    { key: 'inaccuracy', label: '?!',  color: '#f57c00', count: totals.inaccuracy },
    { key: 'mistake',    label: '?',   color: '#e53935', count: totals.mistake    },
    { key: 'blunder',    label: '??',  color: '#b71c1c', count: totals.blunder    },
  ]

  return (
    <div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
        Move quality breakdown (all reviewed games)
      </p>
      <div style={{
        display: 'flex',
        height: '12px',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '10px',
      }}>
        {segments.map(seg => (
          seg.count > 0 && (
            <div
              key={seg.key}
              style={{
                width: `${(seg.count / total) * 100}%`,
                background: seg.color,
              }}
              title={`${seg.label}: ${seg.count}`}
            />
          )
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {segments.map(seg => (
          seg.count > 0 && (
            <span key={seg.key} style={{ fontSize: '12px', color: seg.color, fontWeight: 600 }}>
              {seg.label} {seg.count}
            </span>
          )
        ))}
      </div>
    </div>
  )
}

function ProgressDashboard({ refreshTrigger }: Props) {
  const [games, setGames] = useState<SavedGame[]>([])
  const [stats, setStats] = useState<GameStat[]>([])
  const [reviewing, setReviewing] = useState(false)
  const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    // @ts-ignore
    window.api.loadGames().then((loaded: SavedGame[]) => {
      setGames(loaded)
      setStats(loaded.map(g => ({
        id:         g.id,
        date:       g.date,
        result:     g.result,
        playedAs:   g.playedAs,
        skillLevel: g.skillLevel,
        moveCount:  g.moveCount,
        accuracy:   undefined,
        avgCpLoss:  undefined,
        brilliant:  undefined,
        good:       undefined,
        average:    undefined,
        inaccuracy: undefined,
        mistake:    undefined,
        blunder:    undefined,
      })))
    })
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

  async function analyseAll() {
    setReviewing(true)
    const updated = [...stats]

    for (let i = 0; i < games.length; i++) {
      const game = games[i]
      if (updated.find(s => s.id === game.id && s.accuracy !== undefined)) continue

      try {
        // @ts-ignore
        const review: GameReview = await window.api.reviewGame(game.pgn)
        if (!review) continue

        const summary = game.playedAs === 'white'
          ? review.whiteSummary
          : review.blackSummary

        const idx = updated.findIndex(s => s.id === game.id)
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            accuracy:   summary.accuracy,
            avgCpLoss:  summary.avgCpLoss,
            brilliant:  summary.brilliant,
            good:       summary.good,
            average:    summary.average,
            inaccuracy: summary.inaccuracy,
            mistake:    summary.mistake,
            blunder:    summary.blunder,
          }
          setStats([...updated])
        }
      } catch (err) {
        console.error('Review error:', err)
      }
    }

    setReviewing(false)
  }

  function setProgress(data: { current: number; total: number }) {
    setReviewProgress(data)
  }

  const reviewed    = stats.filter(s => s.accuracy !== undefined)
  const avgAccuracy = reviewed.length > 0
    ? Math.round(reviewed.reduce((s, g) => s + (g.accuracy || 0), 0) / reviewed.length)
    : null
  const wins   = stats.filter(s => s.result === s.playedAs).length
  const draws  = stats.filter(s => s.result === 'draw').length
  const losses = stats.length - wins - draws
  const winRate = stats.length > 0
    ? Math.round((wins / stats.length) * 100)
    : null
  const avgCpLoss = reviewed.length > 0
    ? Math.round(reviewed.reduce((s, g) => s + (g.avgCpLoss || 0), 0) / reviewed.length)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '20px', color: 'var(--text-primary)' }}>
            Progress
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            {stats.length} game{stats.length !== 1 ? 's' : ''} saved
            {reviewed.length > 0 && ` · ${reviewed.length} reviewed`}
          </p>
        </div>
        {games.length > 0 && (
          <button
            onClick={analyseAll}
            disabled={reviewing}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: reviewing ? 'var(--border-strong)' : 'var(--accent)',
              color: reviewing ? 'var(--text-muted)' : '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: reviewing ? 'not-allowed' : 'pointer',
            }}
          >
            {reviewing
              ? `Analysing… ${reviewProgress.current}/${reviewProgress.total}`
              : '📊 Analyse all games'}
          </button>
        )}
      </div>

      {/* Summary stats */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <StatCard
            label="Games played"
            value={stats.length}
            sub={`${wins}W · ${draws}D · ${losses}L`}
          />
          {winRate !== null && (
            <StatCard
              label="Win rate"
              value={`${winRate}%`}
              color={winRate >= 50 ? 'var(--green)' : 'var(--red)'}
            />
          )}
          {avgAccuracy !== null && (
            <StatCard
              label="Avg accuracy"
              value={`${avgAccuracy}%`}
              sub={`${reviewed.length} games reviewed`}
              color={
                avgAccuracy >= 80 ? 'var(--green)'
                : avgAccuracy >= 60 ? 'var(--amber)'
                : 'var(--red)'
              }
            />
          )}
          {avgCpLoss !== null && (
            <StatCard
              label="Avg cp loss"
              value={avgCpLoss}
              sub="centipawns per move"
              color={
                avgCpLoss <= 20 ? 'var(--green)'
                : avgCpLoss <= 50 ? 'var(--amber)'
                : 'var(--red)'
              }
            />
          )}
        </div>
      )}

      {/* Accuracy chart */}
      {stats.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '14px', color: 'var(--text-primary)' }}>
            Accuracy over time
          </h3>
          <AccuracyChart stats={stats} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--green)' }}>● Win</span>
            <span style={{ color: 'var(--text-muted)' }}>● Draw</span>
            <span style={{ color: 'var(--red)' }}>● Loss</span>
          </div>
        </div>
      )}

      {/* Move quality breakdown */}
      {reviewed.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}>
          <MoveQualityBar stats={stats} />
        </div>
      )}

      {/* Per-game table */}
      {stats.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '14px', color: 'var(--text-primary)' }}>
            Game history
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Date', 'Result', 'Played as', 'Difficulty', 'Moves', 'Accuracy', 'Cp loss'].map(h => (
                    <th key={h} style={{
                      padding: '6px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, i) => (
                  <tr
                    key={stat.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-secondary)',
                    }}
                  >
                    <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{stat.date}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{
                        fontWeight: 600,
                        color: stat.result === stat.playedAs
                          ? 'var(--green)'
                          : stat.result === 'draw'
                          ? 'var(--text-muted)'
                          : 'var(--red)',
                      }}>
                        {stat.result === stat.playedAs
                          ? 'Win'
                          : stat.result === 'draw'
                          ? 'Draw'
                          : 'Loss'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {stat.playedAs}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>
                      {getSkillLabel(stat.skillLevel)}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>
                      {stat.moveCount}
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      {stat.accuracy !== undefined ? (
                        <span style={{
                          fontWeight: 600,
                          color: stat.accuracy >= 80
                            ? 'var(--green)'
                            : stat.accuracy >= 60
                            ? 'var(--amber)'
                            : 'var(--red)',
                        }}>
                          {stat.accuracy}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>
                      {stat.avgCpLoss !== undefined
                        ? stat.avgCpLoss
                        : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.length === 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-faint)',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '24px', margin: '0 0 8px' }}>📈</p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            No games yet — play some games and come back here to track your progress.
          </p>
        </div>
      )}
    </div>
  )
}

export default ProgressDashboard