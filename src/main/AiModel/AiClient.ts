import { Ollama } from 'ollama'
import { buildExplanationPrompt, buildComparisonPrompt } from './prompts'
import { LineAnalysis } from '../analysis/AnalysisEngine'

const ollama = new Ollama()

export async function getExplanation(
  fen: string,
  move: string,
  playerLevel: string = 'beginner',
  depth: 'brief' | 'detailed' = 'brief'
): Promise<string> {
  const prompt = buildExplanationPrompt(fen, move, playerLevel, depth)

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [{ role: 'user', content: prompt }],
  })

  return response.message.content
}

export async function getLineSummary(
  analyses: LineAnalysis[],
  playerLevel: string = 'intermediate'
): Promise<string[]> {
  const prompt = buildComparisonPrompt(analyses, playerLevel)

  const response = await ollama.chat({
    model: 'llama3.2',
    messages: [{ role: 'user', content: prompt }],
  })

  // Parse the response — expect one summary per line separated by ---
  const text = response.message.content
  const sections = text.split('---').map((s: string) => s.trim()).filter(Boolean)

  // If parsing fails just return the whole response for each line
  if (sections.length !== analyses.length) {
    return analyses.map(() => text)
  }

  return sections
}