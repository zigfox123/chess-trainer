import { ipcMain } from 'electron'
import { stockfish } from './stockfish/StockfishManager'
import { getExplanation } from './AiModel/AiClient'
import {
  saveGame,
  loadGames,
  deleteGame,
  saveRepertoireLine,
  loadRepertoire,
  deleteRepertoireLine,
  updateRepertoireLine,
} from './store/GameStore'
import { analyseLine, LineAnalysis } from './analysis/AnalysisEngine'
import { reviewGame } from './review/GameReviewer'

export function registerHandlers() {
  ipcMain.handle('ping', () => 'pong')

  ipcMain.handle('stockfish-move', async (_event, fen: string, skillLevel: number) => {
    return await stockfish.getBestMove(fen, skillLevel)
  })

  ipcMain.handle('stockfish-analyse', async (_event, fen: string) => {
    return await stockfish.getTopMoves(fen, 3, 18)
  })

  ipcMain.handle('get-explanation', async (
    _event,
    fen: string,
    move: string,
    level: string,
    depth: 'brief' | 'detailed'
  ) => {
    return await getExplanation(fen, move, level, depth)
  })

  ipcMain.handle('analyse-line', async (_event, moveSequence: string) => {
    return await analyseLine(moveSequence)
  })

  ipcMain.handle('compare-lines', async (_event, analyses: LineAnalysis[], level: string) => {
    const { getLineSummary } = await import('./AiModel/AiClient')
    return await getLineSummary(analyses, level)
  })

  ipcMain.handle('review-game', async (event, pgn: string) => {
    return await reviewGame(pgn, (current, total) => {
      event.sender.send('review-progress', { current, total })
    })
  })

  ipcMain.handle('get-missed-opportunity', async (
    _event,
    fenBefore: string,
    _playedMove: string,
    bestMove: string,
    _evalDelta: number,
    level: string
  ) => {
    const { getExplanation: getRaw } = await import('./AiModel/AiClient')
    return await getRaw(fenBefore, bestMove, level, 'detailed')
  })

  // ── Games ──────────────────────────────────────────────────────────────

  ipcMain.handle('save-game', async (_event, data: {
    pgn: string
    result: string
    playedAs: 'white' | 'black'
    skillLevel: number
    moveCount: number
  }) => {
    return saveGame(data)
  })

  ipcMain.handle('load-games', async () => {
    return loadGames()
  })

  ipcMain.handle('delete-game', async (_event, id: string) => {
    deleteGame(id)
    return true
  })

  // ── Repertoire ─────────────────────────────────────────────────────────

  ipcMain.handle('save-repertoire-line', async (_event, data: {
    name: string
    moves: string
    colour: 'white' | 'black'
    notes: string
  }) => {
    return saveRepertoireLine(data)
  })

  ipcMain.handle('load-repertoire', async () => {
    return loadRepertoire()
  })

  ipcMain.handle('delete-repertoire-line', async (_event, id: string) => {
    deleteRepertoireLine(id)
    return true
  })

  ipcMain.handle('update-repertoire-line', async (_event, id: string, updates: {
    name?: string
    moves?: string
    notes?: string
  }) => {
    updateRepertoireLine(id, updates)
    return true
  })
}