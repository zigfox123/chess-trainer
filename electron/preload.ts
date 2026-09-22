import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping'),

  stockfishMove: (fen: string, skillLevel: number) =>
    ipcRenderer.invoke('stockfish-move', fen, skillLevel),

  stockfishAnalyse: (fen: string) =>
    ipcRenderer.invoke('stockfish-analyse', fen),

  getExplanation: (fen: string, move: string, level: string, depth: string) =>
    ipcRenderer.invoke('get-explanation', fen, move, level, depth),

  analyseLine: (moveSequence: string) =>
    ipcRenderer.invoke('analyse-line', moveSequence),

  compareLines: (analyses: any[], level: string) =>
    ipcRenderer.invoke('compare-lines', analyses, level),

  reviewGame: (pgn: string) =>
    ipcRenderer.invoke('review-game', pgn),

  getMissedOpportunity: (
    fenBefore: string,
    playedMove: string,
    bestMove: string,
    evalDelta: number,
    level: string
  ) => ipcRenderer.invoke(
    'get-missed-opportunity',
    fenBefore,
    playedMove,
    bestMove,
    evalDelta,
    level
  ),

  onReviewProgress: (callback: (data: { current: number; total: number }) => void) => {
    ipcRenderer.on('review-progress', (_event, data) => callback(data))
  },

  offReviewProgress: () => {
    ipcRenderer.removeAllListeners('review-progress')
  },

  saveGame: (data: {
    pgn: string
    result: string
    playedAs: 'white' | 'black'
    skillLevel: number
    moveCount: number
  }) => ipcRenderer.invoke('save-game', data),

  loadGames: () => ipcRenderer.invoke('load-games'),

  deleteGame: (id: string) => ipcRenderer.invoke('delete-game', id),

  // Repertoire
  saveRepertoireLine: (data: {
    name: string
    moves: string
    colour: 'white' | 'black'
    notes: string
  }) => ipcRenderer.invoke('save-repertoire-line', data),

  loadRepertoire: () => ipcRenderer.invoke('load-repertoire'),

  deleteRepertoireLine: (id: string) =>
    ipcRenderer.invoke('delete-repertoire-line', id),

  updateRepertoireLine: (id: string, updates: {
    name?: string
    moves?: string
    notes?: string
  }) => ipcRenderer.invoke('update-repertoire-line', id, updates),
})