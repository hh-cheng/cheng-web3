import useBlocks from './service/useBlocks'

export default function App() {
  const { latestHeight, blocks, loading, error } = useBlocks()

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  // return <div>Hello World</div>
  return (
    <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
      <h2>Chain Blocks</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Latest height:</strong> {latestHeight}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                padding: 8,
              }}
            >
              Height
            </th>
            <th
              style={{
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                padding: 8,
              }}
            >
              Time
            </th>
            <th
              style={{
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                padding: 8,
              }}
            >
              Txs
            </th>
            <th
              style={{
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                padding: 8,
              }}
            >
              Hash
            </th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.height}>
              <td style={{ padding: 8 }}>{b.height}</td>
              <td style={{ padding: 8 }}>{b.time}</td>
              <td style={{ padding: 8 }}>{b.txs}</td>
              <td style={{ padding: 8, fontFamily: 'monospace' }}>
                {b.hash.slice(0, 16)}…{b.hash.slice(-8)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
