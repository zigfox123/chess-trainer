import { Chess } from 'chess.js'
import { stockfish } from '../stockfish/StockfishManager'

export type PositionalFactors = {
  centerControl: number
  kingSafety: number
  pieceActivity: number
  pawnStructure: number
  spaceAdvantage: number
}

export type LineAnalysis = {
  moves: string
  fen: string
  eval: number
  evalType: 'cp' | 'mate'
  factors: PositionalFactors
  complexity: number
}

export function movesToFen(moveSequence: string): string | null {
  try {
    const chess = new Chess()

    const cleaned = moveSequence
      .replace(/\d+\./g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleaned) return chess.fen()

    const moves = cleaned.split(' ').filter(Boolean)

    for (const move of moves) {
      const result = chess.move(move)
      if (!result) return null
    }

    return chess.fen()
  } catch {
    return null
  }
}

function centerControlScore(chess: Chess): number {
  const centerSquares = ['d4', 'd5', 'e4', 'e5']
  let whiteAttacks = 0
  let blackAttacks = 0

  for (const square of centerSquares) {
    const whiteAttackers = chess.attackers(square as any, 'w')
    const blackAttackers = chess.attackers(square as any, 'b')
    whiteAttacks += whiteAttackers.length
    blackAttacks += blackAttackers.length
  }

  const total = whiteAttacks + blackAttacks
  if (total === 0) return 50
  return Math.round((whiteAttacks / total) * 100)
}

function kingSafetyScore(chess: Chess): number {
  const board = chess.board()
  let score = 70

  let kingCol = -1
  let kingRow = -1

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c]
      if (sq && sq.type === 'k' && sq.color === 'w') {
        kingCol = c
        kingRow = r
      }
    }
  }

  if (kingCol === -1) return score

  let shieldPawns = 0
  const shieldRow = kingRow - 1
  if (shieldRow >= 0) {
    for (let c = Math.max(0, kingCol - 1); c <= Math.min(7, kingCol + 1); c++) {
      const sq = board[shieldRow][c]
      if (sq && sq.type === 'p' && sq.color === 'w') {
        shieldPawns++
      }
    }
  }
  score += shieldPawns * 8

  for (let c = Math.max(0, kingCol - 1); c <= Math.min(7, kingCol + 1); c++) {
    let hasPawn = false
    for (let r = 0; r < 8; r++) {
      const sq = board[r][c]
      if (sq && sq.type === 'p' && sq.color === 'w') {
        hasPawn = true
        break
      }
    }
    if (!hasPawn) score -= 10
  }

  return Math.max(0, Math.min(100, score))
}

function pieceActivityScore(chess: Chess): number {
  const moves = chess.moves({ verbose: true })
  const whiteMoves = moves.filter(m => {
    const piece = chess.get(m.from as any)
    return piece && piece.color === 'w'
  })
  return Math.min(100, Math.round((whiteMoves.length / 35) * 100))
}

function pawnStructureScore(chess: Chess): number {
  const board = chess.board()
  let score = 80

  const whitePawnCols: number[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c]
      if (sq && sq.type === 'p' && sq.color === 'w') {
        whitePawnCols.push(c)
      }
    }
  }

  for (let c = 0; c < 8; c++) {
    const count = whitePawnCols.filter(col => col === c).length
    if (count > 1) score -= (count - 1) * 10
  }

  const uniqueCols = [...new Set(whitePawnCols)]
  for (const col of uniqueCols) {
    const hasNeighbour = uniqueCols.includes(col - 1) || uniqueCols.includes(col + 1)
    if (!hasNeighbour) score -= 8
  }

  return Math.max(0, Math.min(100, score))
}

function spaceAdvantageScore(chess: Chess): number {
  const board = chess.board()
  let whiteSpace = 0
  let totalSpace = 0

  for (let r = 4; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      totalSpace++
      const sq = board[r][c]
      if (!sq || sq.color !== 'b') {
        whiteSpace++
      }
    }
  }

  return Math.round((whiteSpace / totalSpace) * 100)
}

function complexityScore(topEvals: number[]): number {
  if (topEvals.length < 2) return 20
  const spread = Math.abs(topEvals[0] - topEvals[topEvals.length - 1])
  return Math.max(0, Math.min(100, 100 - Math.round(spread / 5)))
}

export async function analyseLine(moveSequence: string): Promise<LineAnalysis | null> {
  const fen = movesToFen(moveSequence)
  if (!fen) return null

  const chess = new Chess(fen)
  const topMoves = await stockfish.getTopMoves(fen, 3, 18)
  if (topMoves.length === 0) return null

  const best = topMoves[0]
  const topEvals = topMoves.map(m => m.eval)

  const factors: PositionalFactors = {
    centerControl:  centerControlScore(chess),
    kingSafety:     kingSafetyScore(chess),
    pieceActivity:  pieceActivityScore(chess),
    pawnStructure:  pawnStructureScore(chess),
    spaceAdvantage: spaceAdvantageScore(chess),
  }

  return {
    moves:      moveSequence || 'Starting position',
    fen,
    eval:       best.eval,
    evalType:   best.evalType,
    factors,
    complexity: complexityScore(topEvals),
  }
}