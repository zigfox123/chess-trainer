import { useEffect } from 'react'

export type TreeNode = {
  id: string
  move: string       // SAN notation e.g. 'e4'
  fen: string        // position after this move
  uci: string        // UCI move e.g. 'e2e4'
  colour: 'w' | 'b'
  moveNumber: number
  children: TreeNode[]
  isMainLine: boolean
}

type Props = {
  root: TreeNode | null
  selectedId: string | null
  onSelect: (node: TreeNode) => void
}

function NodeButton({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  selectedId: string | null
  onSelect: (node: TreeNode) => void
}) {
  const isSelected = node.id === selectedId
  const isMainLine = node.isMainLine

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Move number for white moves */}
        {node.colour === 'w' && (
          <span style={{ fontSize: '11px', color: '#aaa', minWidth: '24px' }}>
            {node.moveNumber}.
          </span>
        )}
        {/* Move button */}
        <button
          onClick={() => onSelect(node)}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: isSelected ? '1.5px solid #4a90d9' : '1.5px solid transparent',
            background: isSelected
              ? '#e8f0fb'
              : isMainLine
              ? 'transparent'
              : '#fff8e1',
            color: isSelected ? '#1a3a8a' : isMainLine ? '#222' : '#e65100',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: isSelected ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.1s',
          }}
        >
          {node.move}
        </button>
      </div>

      {/* Children — branch lines indented */}
      {node.children.length > 0 && (
        <div style={{ marginLeft: node.colour === 'w' ? '28px' : '8px' }}>
          {node.children.map(child => (
            <NodeButton
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function flattenTree(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node]
  for (const child of node.children) {
    result.push(...flattenTree(child))
  }
  return result
}

function VariationTree({ root, selectedId, onSelect }: Props) {
  // Arrow key navigation
  useEffect(() => {
    if (!root || !selectedId) return

    function handleKey(e: KeyboardEvent) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      if (!root) return

      e.preventDefault()
      const allNodes = flattenTree(root)
      const currentIndex = allNodes.findIndex(n => n.id === selectedId)
      if (currentIndex === -1) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        // Move forward — first child
        const current = allNodes[currentIndex]
        if (current.children.length > 0) {
          onSelect(current.children[0])
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        // Move backward — find parent
        for (const node of allNodes) {
          if (node.children.some(c => c.id === selectedId)) {
            onSelect(node)
            break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [root, selectedId, onSelect])

  if (!root) {
    return (
      <div style={{
        width: '300px',
        background: '#f8f8f8',
        borderRadius: '8px',
        padding: '1rem',
      }}>
        <h3 style={{ margin: '0 0 0.5rem' }}>Variation Tree</h3>
        <p style={{ color: '#aaa', fontSize: '13px' }}>No moves yet</p>
      </div>
    )
  }

  return (
    <div style={{
      width: '300px',
      background: '#f8f8f8',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <h3 style={{ margin: '0 0 0.25rem' }}>Variation Tree</h3>
      <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 0.75rem' }}>
        ← → to navigate · click any move
      </p>
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {root.children.map(child => (
          <NodeButton
            key={child.id}
            node={child}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

export default VariationTree