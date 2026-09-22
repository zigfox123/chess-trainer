# ♟ Chess Trainer

An AI-powered desktop chess training application built with Electron, React, and TypeScript. Play against Stockfish at adjustable difficulty levels, get plain-English coaching explanations for every move, explore variations interactively, and review your games with detailed analysis.

## Features

### 🎮 Play
- Play against Stockfish at 5 difficulty levels — Beginner through Master
- Play as white or black with automatic board orientation
- On-demand AI coaching explanations for both your moves and Stockfish's moves
- Last move highlighting, check detection, and promotion support
- Undo move, flip board, and new game controls
- Game history saved automatically

### 🔍 Explore Mode
- After any Stockfish move, explore the top 3 candidate responses
- Colour-coded arrows on the board showing each candidate (green / blue / orange)
- Hover any candidate to preview the resulting position
- Click a candidate for an AI explanation of why that move works
- Explanations cached so repeated clicks are instant

### 🌿 Variation Mode
- Rewind to any point in your current game using the move timeline
- Play a different move and see 3 Stockfish response options
- Pick which response Stockfish plays and continue exploring the line
- Full variation history shown as you build out the line
- Return to the live game at any time

### 🔬 Line Analyser
- Compare up to 3 opening or middlegame lines side by side
- Positional factor breakdown — center control, king safety, piece activity, pawn structure, space, complexity
- Square control heatmap showing territorial dominance
- AI coaching summary with one strength, one weakness, and a player-type recommendation per line

### 📋 Game Review
- Load any saved game for full move-by-move Stockfish analysis
- Move quality classification — brilliant (!!) / good (!) / average / inaccuracy (?!) / mistake (?) / blunder (??)
- Eval bar showing the position evaluation after each move
- Best move arrow showing what Stockfish would have played
- Jump between critical moments and mistakes with dedicated navigation buttons
- AI explanation of what was missed at each mistake or blunder

### 📈 Progress
- Accuracy percentage per game based on average centipawn loss
- Win/draw/loss record and win rate
- Accuracy over time chart with results colour-coded by outcome
- Move quality breakdown across all reviewed games
- Per-game table with date, result, difficulty, accuracy, and centipawn loss

### 📖 Opening Repertoire
- Save preferred opening lines for white and black
- Board preview updates as you type move sequences
- Inline move validation with immediate feedback
- Notes field for key ideas and plans per line
- Edit and delete saved lines at any time

### 🌙 Dark Mode
- System preference detection with manual override
- Light / Dark / System options in settings

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | New game |
| `F` | Flip board |
| `E` | Toggle explore mode |
| `U` | Undo last move |
| `← →` | Navigate variation tree / game review |
| `Home` | Jump to start (review) |
| `End` | Jump to end (review) |
| `?` | Show shortcuts modal |
| `Escape` | Exit explore mode / close modal |

---

## Prerequisites

Before running Chess Trainer you need three things installed:

### 1. Node.js 20+
Download from https://nodejs.org — version 20 LTS or higher required.

### 2. Ollama
Ollama runs the AI coaching model locally on your machine — no API costs, no internet required after setup.

**Linux / macOS:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
```

**Windows:**
Download from https://ollama.com/download/windows, install it, then open PowerShell and run:
```
ollama pull llama3.2
```

### 3. Stockfish binary
Download the correct binary for your platform from https://stockfishchess.org/download/ and place it in the `resources/stockfish/` folder.

| Platform | Binary name | Download |
|----------|-------------|---------|
| Linux | `stockfish-linux` | [Stockfish for Linux](https://stockfishchess.org/download/) |
| Windows | `stockfish-windows.exe` | [Stockfish for Windows](https://stockfishchess.org/download/) |
| macOS | `stockfish-macos` | [Stockfish for macOS](https://stockfishchess.org/download/) |

After downloading, make the binary executable on Linux/macOS:
```bash
chmod +x resources/stockfish/stockfish-linux
# or
chmod +x resources/stockfish/stockfish-macos
```

---

## Installation

### Run from source

```bash
# Clone the repository
git clone https://github.com/yourusername/chess-trainer.git
cd chess-trainer

# Install dependencies
npm install

# Add your Stockfish binary to resources/stockfish/ (see Prerequisites)

# Start the app in development mode
npm run dev
```

### Build a distributable

```bash
# Build for your current platform
npm run build

# Build specifically for Linux
npx electron-builder --linux

# Build specifically for Windows (requires Wine on Linux)
sudo apt install wine64
npx electron-builder --win
```

Built installers appear in `release/0.0.0/`:
- Linux: `Chess Trainer-Linux-0.0.0.AppImage`
- Windows: `Chess Trainer-Windows-0.0.0-Setup.exe`

---

## Project structure

```
chess-trainer/
├── electron/                   Electron main process entry points
│   ├── main.ts                 App entry, BrowserWindow setup
│   └── preload.ts              contextBridge — IPC API surface
├── src/
│   ├── main/                   Node.js main process logic
│   │   ├── AiModel/            Ollama client and prompt templates
│   │   ├── analysis/           AnalysisEngine — positional factor extraction
│   │   ├── review/             Move classifier and game reviewer
│   │   ├── stockfish/          StockfishManager — UCI protocol
│   │   ├── store/              electron-store persistence
│   │   └── ipc.ts              All IPC handler registrations
│   └── renderer/               React app
│       ├── components/
│       │   ├── Board/          Main chess board and game logic
│       │   ├── CandidateMoves/ Explore mode candidate cards
│       │   ├── ExplanationPanel/ AI coaching panel
│       │   ├── GameHistory/    Saved game history panel
│       │   ├── LineAnalyser/   Line comparison tool
│       │   ├── Progress/       Progress dashboard and charts
│       │   ├── Repertoire/     Opening repertoire builder
│       │   ├── Review/         Game review mode
│       │   ├── Settings/       Settings panel
│       │   ├── UI/             Shared UI components
│       │   └── Variation/      Variation mode
│       ├── hooks/              Custom React hooks
│       └── types.ts            Shared TypeScript types
├── resources/
│   ├── icon.png                App icon (Linux)
│   ├── icon.ico                App icon (Windows)
│   └── stockfish/              Stockfish binaries (not included — see Prerequisites)
└── electron-builder.json5      Packaging configuration
```

---

## Tech stack

| Category | Technology |
|----------|-----------|
| Desktop framework | Electron 30 |
| UI | React 18 + TypeScript |
| Bundler | Vite |
| Chess engine | Stockfish 17 (native binary, UCI protocol) |
| Chess logic | chess.js |
| Board rendering | react-chessboard |
| AI explanations | Ollama (llama3.2) — runs locally |
| State persistence | electron-store |
| Packaging | electron-builder |
| Platforms | Linux, Windows (macOS binary detection included) |

---

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Type check without building
npx tsc --noEmit

# Build for production
npm run build
```

### Adding a new AI model

The AI model is configured in `src/main/AiModel/AiClient.ts`. To use a different Ollama model, change the `model` field:

```typescript
const response = await ollama.chat({
  model: 'llama3.2',   // change to any model you have pulled
  messages: [{ role: 'user', content: prompt }],
})
```

Any model available via `ollama list` can be used. Larger models like `llama3.1:70b` will give better explanations but run slower.

---

## Troubleshooting

**Stockfish doesn't respond**
- Check the binary is in `resources/stockfish/` with the correct name for your platform
- On Linux/macOS confirm it's executable: `chmod +x resources/stockfish/stockfish-linux`
- Check the app has permission to execute files in that location

**Ollama explanations don't appear**
- Confirm Ollama is running: `ollama list` should show llama3.2
- On Windows check the Ollama icon is in the system tray
- Try restarting Ollama: `ollama serve` in a terminal

**App shows a blank screen**
- Open developer tools with `Ctrl+Shift+I` and check the console for errors
- Try deleting `node_modules/` and running `npm install` again

**Build fails on Windows cross-compilation**
- Install Wine: `sudo apt install wine64`
- Then retry: `npx electron-builder --win`

---

## Licence

MIT — see [LICENSE](LICENSE) for details.