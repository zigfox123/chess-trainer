import { PositionalFactors } from '../../../main/analysis/AnalysisEngine'

type Props = {
  factors: PositionalFactors
  complexity: number
  eval: number
  evalType: 'cp' | 'mate'
}

function getBarColor(value: number): string {
  if (value >= 70) return '#2e7d32'
  if (value >= 45) return '#f57c00'
  return '#c62828'
}

function formatEval(value: number, type: 'cp' | 'mate'): string {
  if (type === 'mate') {
    return value > 0 ? `Mate in ${value}` : `-Mate in ${Math.abs(value)}`
  }
  const pawns = value / 100
  return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2)
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px', color: '#555' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#888' }}>{value}</span>
      </div>
      <div style={{
        height: '6px',
        background: '#eee',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: getBarColor(value),
          borderRadius: '3px',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

function FactorBars({ factors, complexity, eval: evalValue, evalType }: Props) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '13px', color: '#555' }}>Evaluation</span>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: evalValue >= 0 ? '#2e7d32' : '#c62828',
        }}>
          {formatEval(evalValue, evalType)}
        </span>
      </div>

      <Bar label="Center control"  value={factors.centerControl}  />
      <Bar label="King safety"     value={factors.kingSafety}     />
      <Bar label="Piece activity"  value={factors.pieceActivity}  />
      <Bar label="Pawn structure"  value={factors.pawnStructure}  />
      <Bar label="Space advantage" value={factors.spaceAdvantage} />
      <Bar label="Complexity"      value={complexity}             />
    </div>
  )
}

export default FactorBars