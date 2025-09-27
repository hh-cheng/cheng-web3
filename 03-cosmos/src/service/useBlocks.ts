import { toHex } from '@cosmjs/encoding'
import { useEffect, useState, useTransition } from 'react'

import { POLL_MS, RECENT_BLOCKS } from '../../config'
import { getStatus, getBlockWithID } from './tmClient'

interface SimpleBlock {
  height: number
  time: string
  hash: string
  txs: number
}

export default function useBlocks() {
  const [error, setError] = useState('')
  const [latestHeight, setLatestHeight] = useState(0)
  const [blocks, setBlocks] = useState<SimpleBlock[]>([])

  const [loading, startTransition] = useTransition()

  useEffect(() => {
    const tick = () => {
      startTransition(async () => {
        try {
          const status = await getStatus()
          const h = +status.syncInfo.latestBlockHeight
          if (!Number.isFinite(h)) return

          setLatestHeight(h)

          const start = Math.max(1, h - (RECENT_BLOCKS - 1))
          const heights = Array.from(
            { length: h - start + 1 },
            (_, i) => start + i,
          ).reverse()

          const results = await Promise.all(
            heights.map(async (height) => {
              const { blockId, block } = await getBlockWithID(height)
              const hash = blockId.hash ? toHex(blockId.hash) : ''
              const time = block.header.time.toISOString() || ''
              const txs = block.txs.length ?? 0
              return { height, time, hash, txs }
            }),
          )

          setBlocks(results)
        } catch (err: any) {
          setError(err?.message || String(err))
        }
      })
    }

    tick()
    const timer = window.setInterval(tick, POLL_MS)

    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [])

  return { latestHeight, blocks, loading, error }
}
