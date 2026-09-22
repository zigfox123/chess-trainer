export type BoardHandle = {
  newGame:       () => void
  flipBoard:     () => void
  toggleExplore: () => void
  undoMove:      () => void
}