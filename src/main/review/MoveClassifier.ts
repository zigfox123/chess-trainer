export type MoveQuality =
  | 'brilliant'
  | 'good'
  | 'average'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'forced'

export type ClassifiedMove = {
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  evalBefore: number
  evalAfter: number
  evalDelta: number
  bestMove: string
  bestEval: number
  quality: MoveQuality
  moveNumber: number
  colour: 'w' | 'b'
  isCritical: boolean
}

// Thresholds in centipawns — how much worse than best move
const THRESHOLDS = {
  brilliant:   0,    // exactly matches or beats best move AND was non-obvious
  good:        20,   // within 20cp of best — actively strong move
  average:     60,   // within 60cp — normal developing/maintaining move
  inaccuracy: 150,   // 60-150cp worse — noticeable but not game-changing
  mistake:    300,   // 150-300cp worse — significant error
  // anything worse = blunder
}

// Critical moment — eval swings by more than 200cp
const CRITICAL_THRESHOLD = 200

export function classifyMove(
  evalBefore: number,
  evalAfter: number,
  bestEval: number,
  colour: 'w' | 'b'
): MoveQuality {
  const sign = colour === 'w' ? 1 : -1

  const playerBestEval   = bestEval   * sign
  const playerEvalAfter  = evalAfter  * sign
  const playerEvalBefore = evalBefore * sign

  // How much worse than best move (negative = worse than best)
  const deltaFromBest = playerEvalAfter - playerBestEval

  // Brilliant — only if the move matches the best move AND
  // the position was complex (best eval significantly better than prev)
  // This prevents trivial recaptures from being labelled brilliant
  const isBrilliant = deltaFromBest >= -5
    && Math.abs(playerBestEval - playerEvalBefore) > 80
    && playerEvalAfter > playerEvalBefore + 50

  if (isBrilliant) return 'brilliant'

  // Classify by how much worse than best
  if (deltaFromBest >= -THRESHOLDS.good)       return 'good'
  if (deltaFromBest >= -THRESHOLDS.average)    return 'average'
  if (deltaFromBest >= -THRESHOLDS.inaccuracy) return 'inaccuracy'
  if (deltaFromBest >= -THRESHOLDS.mistake)    return 'mistake'
  return 'blunder'
}

export function isCriticalMoment(evalBefore: number, evalAfter: number): boolean {
  return Math.abs(evalAfter - evalBefore) >= CRITICAL_THRESHOLD
}

export function getQualityLabel(quality: MoveQuality): string {
  const labels: Record<MoveQuality, string> = {
    brilliant:  '!!',
    good:       '!',
    average:    '',
    inaccuracy: '?!',
    mistake:    '?',
    blunder:    '??',
    forced:     '',
  }
  return labels[quality]
}

export function getQualityColor(quality: MoveQuality): string {
  const colors: Record<MoveQuality, string> = {
    brilliant:  '#1565c0',
    good:       '#2e7d32',
    average:    '#555555',
    inaccuracy: '#f57c00',
    mistake:    '#e53935',
    blunder:    '#b71c1c',
    forced:     '#888888',
  }
  return colors[quality]
}

export function getQualityBg(quality: MoveQuality): string {
  const colors: Record<MoveQuality, string> = {
    brilliant:  '#e3f2fd',
    good:       '#e8f5e9',
    average:    '#f5f5f5',
    inaccuracy: '#fff3e0',
    mistake:    '#fdecea',
    blunder:    '#fce4ec',
    forced:     '#f5f5f5',
  }
  return colors[quality]
}

export function getQualityDescription(quality: MoveQuality): string {
  const desc: Record<MoveQuality, string> = {
    brilliant:  'Brilliant move',
    good:       'Good move',
    average:    'Average move',
    inaccuracy: 'Inaccuracy',
    mistake:    'Mistake',
    blunder:    'Blunder',
    forced:     'Forced move',
  }
  return desc[quality]
}

export type ReviewSummary = {
  brilliant:   number
  good:        number
  average:     number
  inaccuracy:  number
  mistake:     number
  blunder:     number
  forced:      number
  accuracy:    number
  avgCpLoss:   number
}

export function summariseReview(
  moves: ClassifiedMove[],
  colour: 'w' | 'b'
): ReviewSummary {
  const playerMoves = moves.filter(m => m.colour === colour)

  const counts = {
    brilliant:  0,
    good:       0,
    average:    0,
    inaccuracy: 0,
    mistake:    0,
    blunder:    0,
    forced:     0,
  }

  let totalCpLoss  = 0
  let movesWithLoss = 0

  for (const move of playerMoves) {
    counts[move.quality]++

    const loss = Math.min(300, Math.max(0, -move.evalDelta))
    if (move.quality !== 'forced') {
      totalCpLoss += loss
      movesWithLoss++
    }
  }

  const avgCpLoss = movesWithLoss > 0
    ? Math.round(totalCpLoss / movesWithLoss)
    : 0

  const accuracy = avgCpLoss === 0
    ? 100
    : Math.max(0, Math.min(100, Math.round(
        103.1668 * Math.exp(-0.04354 * avgCpLoss) - 3.1668
      )))

  return {
    ...counts,
    accuracy,
    avgCpLoss,
  }
}