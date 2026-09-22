import { spawn, ChildProcess } from 'child_process'
import path from 'path'

export type TopMove = {
  rank: number
  move: string
  eval: number
  evalType: 'cp' | 'mate'
  line: string[]
}

function getStockfishBinary(): string {
  const platform = process.platform

  const binaries: Record<string, string> = {
    win32:  'stockfish-windows.exe',
    darwin: 'stockfish-macos',
    linux:  'stockfish-linux',
  }

  const binary = binaries[platform]
  if (!binary) throw new Error(`Unsupported platform: ${platform}`)

  const isDev = !!process.env.VITE_DEV_SERVER_URL

  let base: string
  if (isDev) {
    // Dev mode — binaries are in project root resources/stockfish/
    base = path.join(process.env.APP_ROOT || '', 'resources', 'stockfish')
  } else {
    // Production — electron-builder puts extraResources directly in resources/
    base = path.join(process.resourcesPath, 'stockfish')
  }

  const fullPath = path.join(base, binary)
  console.log('Stockfish binary path:', fullPath)
  return fullPath
}

export class StockfishManager {
  private process: ChildProcess | null = null
  private buffer: string = ''
  private listeners: ((line: string) => void)[] = []

  start() {
    const binaryPath = getStockfishBinary()

    this.process = spawn(binaryPath)

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString()
      const lines = this.buffer.split('\n')
      this.buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        for (const listener of this.listeners) {
          listener(trimmed)
        }
      }
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error('Stockfish stderr:', data.toString())
    })

    this.process.on('error', (err) => {
      console.error('Stockfish process error:', err)
    })

    this.process.on('exit', (code) => {
      console.log('Stockfish exited with code:', code)
    })

    this.send('uci')
    this.send('isready')
  }

  private send(cmd: string) {
    this.process?.stdin?.write(cmd + '\n')
  }

  private addListener(fn: (line: string) => void): () => void {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn)
    }
  }

  private waitForLine(predicate: (line: string) => boolean): Promise<string> {
    return new Promise(resolve => {
      const remove = this.addListener(line => {
        if (predicate(line)) {
          remove()
          resolve(line)
        }
      })
    })
  }

  private collectLines(isDone: (line: string) => boolean): Promise<string[]> {
    return new Promise(resolve => {
      const collected: string[] = []
      const remove = this.addListener(line => {
        collected.push(line)
        if (isDone(line)) {
          remove()
          resolve(collected)
        }
      })
    })
  }

  async getBestMove(fen: string, skillLevel: number = 10): Promise<string> {
    this.send(`setoption name Skill Level value ${skillLevel}`)
    this.send(`setoption name MultiPV value 1`)
    this.send(`position fen ${fen}`)
    this.send('go movetime 1000')

    const line = await this.waitForLine(l => l.startsWith('bestmove'))
    return line.split(' ')[1]
  }

  async getTopMoves(fen: string, numLines: number = 3, depth: number = 18): Promise<TopMove[]> {
    this.send(`setoption name Skill Level value 20`)
    this.send(`setoption name MultiPV value ${numLines}`)
    this.send(`position fen ${fen}`)
    this.send(`go depth ${depth}`)

    const lines = await this.collectLines(l => l.startsWith('bestmove'))

    const rankMap = new Map<number, TopMove>()

    for (const line of lines) {
      if (!line.startsWith('info') || !line.includes('multipv')) continue
      if (!line.includes(' pv ')) continue

      const multipvMatch = line.match(/multipv (\d+)/)
      const pvMatch      = line.match(/ pv (.+)/)

      if (!multipvMatch || !pvMatch) continue

      const rank    = parseInt(multipvMatch[1])
      const pvMoves = pvMatch[1].trim().split(' ').filter(Boolean)
      const move    = pvMoves[0]

      if (!move) continue

      let evalValue = 0
      let evalType: 'cp' | 'mate' = 'cp'

      const cpMatch   = line.match(/score cp (-?\d+)/)
      const mateMatch = line.match(/score mate (-?\d+)/)

      if (mateMatch) {
        evalType  = 'mate'
        evalValue = parseInt(mateMatch[1])
      } else if (cpMatch) {
        evalType  = 'cp'
        evalValue = parseInt(cpMatch[1])
      }

      rankMap.set(rank, {
        rank,
        move,
        eval: evalValue,
        evalType,
        line: pvMoves,
      })
    }

    return Array.from(rankMap.values()).sort((a, b) => a.rank - b.rank)
  }

  stop() {
    this.send('quit')
    this.process?.kill()
    this.process = null
  }
}

export const stockfish = new StockfishManager()