import Store from 'electron-store'

type SavedGame = {
  id: string
  pgn: string
  result: string
  playedAs: 'white' | 'black'
  skillLevel: number
  date: string
  moveCount: number
}

type RepertoireLine = {
  id: string
  name: string
  moves: string        // e.g. '1.e4 e5 2.Nf3 Nc6'
  colour: 'white' | 'black'
  notes: string
  createdAt: string
}

type Schema = {
  games: SavedGame[]
  repertoire: RepertoireLine[]
}

const store = new Store<Schema>({
  defaults: {
    games: [],
    repertoire: [],
  }
})

// ── Games ─────────────────────────────────────────────────────────────────

export function saveGame(game: Omit<SavedGame, 'id' | 'date'>): SavedGame {
  const saved: SavedGame = {
    ...game,
    id: Date.now().toString(),
    date: new Date().toLocaleDateString(),
  }
  const games = store.get('games')
  store.set('games', [saved, ...games].slice(0, 50))
  return saved
}

export function loadGames(): SavedGame[] {
  return store.get('games')
}

export function deleteGame(id: string): void {
  const games = store.get('games').filter(g => g.id !== id)
  store.set('games', games)
}

// ── Repertoire ────────────────────────────────────────────────────────────

export function saveRepertoireLine(
  line: Omit<RepertoireLine, 'id' | 'createdAt'>
): RepertoireLine {
  const saved: RepertoireLine = {
    ...line,
    id: Date.now().toString(),
    createdAt: new Date().toLocaleDateString(),
  }
  const repertoire = store.get('repertoire')
  store.set('repertoire', [saved, ...repertoire])
  return saved
}

export function loadRepertoire(): RepertoireLine[] {
  return store.get('repertoire')
}

export function deleteRepertoireLine(id: string): void {
  const repertoire = store.get('repertoire').filter(l => l.id !== id)
  store.set('repertoire', repertoire)
}

export function updateRepertoireLine(
  id: string,
  updates: Partial<Omit<RepertoireLine, 'id' | 'createdAt'>>
): void {
  const repertoire = store.get('repertoire').map(l =>
    l.id === id ? { ...l, ...updates } : l
  )
  store.set('repertoire', repertoire)
}