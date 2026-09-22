import { LineAnalysis } from '../analysis/AnalysisEngine'

export function buildExplanationPrompt(
  fen: string,
  move: string,
  playerLevel: string,
  depth: 'brief' | 'detailed'
): string {
  if (depth === 'brief') {
    return `You are a chess coach for a ${playerLevel} player.
Position (FEN): ${fen}
Stockfish played: ${move}

In 2-3 sentences explain WHY this move was chosen.
Focus on one concept only: threats, piece activity, pawn structure, king safety, or space.
End with one short tip. Plain English only.`
  }

  return `You are a chess coach for a ${playerLevel} player.
Position (FEN): ${fen}
Stockfish played: ${move}

Give a detailed explanation covering:
1. The main idea behind this move
2. What threat or plan it creates or prevents
3. How it affects the pawn structure or piece activity
4. What the player should watch out for next
5. One actionable lesson to remember

Plain English only, define any chess terms you use.`
}

export function buildComparisonPrompt(
  analyses: LineAnalysis[],
  playerLevel: string
): string {
  const lineDescriptions = analyses.map((a, i) => {
    const evalStr = a.evalType === 'mate'
      ? `Forced mate in ${Math.abs(a.eval)}`
      : `${a.eval > 0 ? '+' : ''}${(a.eval / 100).toFixed(2)} pawns`

    return `Line ${i + 1}: ${a.moves}
Evaluation: ${evalStr}
Center control: ${a.factors.centerControl}/100
King safety: ${a.factors.kingSafety}/100
Piece activity: ${a.factors.pieceActivity}/100
Pawn structure: ${a.factors.pawnStructure}/100
Space advantage: ${a.factors.spaceAdvantage}/100
Complexity: ${a.complexity}/100`
  }).join('\n\n')

  return `You are a chess coach comparing opening lines for a ${playerLevel} player.

${lineDescriptions}

For each line write a short coaching summary (3-4 sentences) covering:
1. The main strength of this line
2. The main weakness or risk
3. What type of player suits it (tactical / positional / endgame-focused)

Separate each line's summary with exactly: ---
Do NOT repeat the raw numbers. Interpret them as practical advice.
Plain English only.`
}