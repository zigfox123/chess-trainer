import { Chess } from 'chess.js'
import { stockfish } from '../stockfish/StockfishManager'
import {
  ClassifiedMove,
  ReviewSummary,
  classifyMove,
  isCriticalMoment,
  summariseReview,
} from './MoveClassifier'

export type GameReview = {
  moves: ClassifiedMove[]
  whiteSummary: ReviewSummary
  blackSummary: ReviewSummary
  criticalMoments: number[]   // indices of critical moves
}

// Parse a PGN string into a list of moves using chess.js
function parsePgn(pgn: string): { san: string; uci: string }[] | null {
  try {
    const chess = new Chess()
    chess.loadPgn(pgn)
    const history = chess.history({ verbose: true })
    return history.map(m => ({ san: m.san, uci: m.lan }))
  } catch {
    return null
  }
}

// Get centipawn evaluation from Stockfish for a position
async function getEval(fen: string): Promise<{ eval: number; bestMove: string; bestEval: number }> {
  const topMoves = await stockfish.getTopMoves(fen, 1, 14)

  if (topMoves.length === 0) {
    return { eval: 0, bestMove: '', bestEval: 0 }
  }

  const best = topMoves[0]

  // For mate scores use a large centipawn value
  if (best.evalType === 'mate') {
    const mateScore = best.eval > 0 ? 10000 : -10000
    return { eval: mateScore, bestMove: best.move, bestEval: mateScore }
  }

  return {
    eval:     best.eval,
    bestMove: best.move,
    bestEval: best.eval,
  }
}

export async function reviewGame(
  pgn: string,
  onProgress?: (current: number, total: number) => void
): Promise<GameReview | null> {
  const moves = parsePgn(pgn)
  if (!moves) return null

  const chess = new Chess()
  const classified: ClassifiedMove[] = []
  const criticalMoments: number[] = []

  // Get starting eval
  let prevEval = 0
  try {
    const startEval = await getEval(chess.fen())
    prevEval = startEval.eval
  } catch {
    prevEval = 0
  }

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    const fenBefore = chess.fen()
    const colour = chess.turn()

    // Report progress so the UI can show a progress bar
    onProgress?.(i + 1, moves.length)

    // Get the best move and eval BEFORE applying the move
    let bestMove = ''
    let bestEval = prevEval

    try {
      const analysis = await getEval(fenBefore)
      bestMove = analysis.bestMove
      bestEval = analysis.bestEval
    } catch {
      bestMove = move.uci
      bestEval = prevEval
    }

    // Apply the move
    chess.move(move.san)
    const fenAfter = chess.fen()

    // Get eval AFTER the move
    let evalAfter = prevEval
    try {
      const afterAnalysis = await getEval(fenAfter)
      evalAfter = afterAnalysis.eval
    } catch {
      evalAfter = prevEval
    }

    // Calculate eval delta from the moving player's perspective
    const sign = colour === 'w' ? 1 : -1
    const evalDelta = (evalAfter - bestEval) * sign

    const quality = classifyMove(prevEval, evalAfter, bestEval, colour)
    const critical = isCriticalMoment(prevEval, evalAfter)

    if (critical) {
      criticalMoments.push(i)
    }

    classified.push({
      san:        move.san,
      uci:        move.uci,
      fenBefore,
      fenAfter,
      evalBefore: prevEval,
      evalAfter,
      evalDelta,
      bestMove,
      bestEval,
      quality,
      moveNumber: Math.ceil((i + 1) / 2),
      colour,
      isCritical: critical,
    })

    prevEval = evalAfter
  }

  return {
    moves: classified,
    whiteSummary: summariseReview(classified, 'w'),
    blackSummary: summariseReview(classified, 'b'),
    criticalMoments,
  }
}