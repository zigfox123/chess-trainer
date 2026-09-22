type Props = {
  summaries: string[]
  lineNames: string[]
  loading: boolean
}

function ComparisonSummary({ summaries, lineNames, loading }: Props) {
  if (loading) {
    return (
      <div style={{
        background: '#f8f8f8',
        borderRadius: '8px',
        padding: '1rem',
      }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>AI Coaching Summary</h3>
        <p style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>
          Analysing lines…
        </p>
      </div>
    )
  }

  if (summaries.length === 0) return null

  const colors = ['#1b5e20', '#0d47a1', '#e65100']
  const bgColors = ['#e8f5e9', '#e3f2fd', '#fff3e0']

  return (
    <div style={{
      background: '#f8f8f8',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <h3 style={{ margin: '0 0 0.75rem' }}>AI Coaching Summary</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {summaries.map((summary, i) => (
          <div
            key={i}
            style={{
              background: bgColors[i] || '#f8f8f8',
              borderRadius: '8px',
              padding: '10px 12px',
              borderLeft: `3px solid ${colors[i] || '#888'}`,
            }}
          >
            <p style={{
              fontSize: '12px',
              fontWeight: 700,
              color: colors[i] || '#888',
              margin: '0 0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {lineNames[i] || `Line ${i + 1}`}
            </p>
            <p style={{
              fontSize: '13px',
              color: '#333',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComparisonSummary