'use client'
import { useEffect, useState } from 'react'

import useWallet from '@hooks/useWallet'
import { Button } from '@/components/ui/button'
import Wallet from '@components/business/Wallet'
import useRedPocketContract from '@hooks/useRedPocketContract'

function formatEth(value: bigint | number | undefined) {
  if (value === undefined) return '-'
  try {
    return `${Number(value) / 1e18}`
  } catch {
    return '-'
  }
}

export default function Home() {
  const { account, isConnected } = useWallet()
  const {
    address,
    getSummary,
    getUserClaimedAmount,
    deposit,
    grabRedPocket,
    refund,
    emergencyStop,
  } = useRedPocketContract()

  const [summary, setSummary] = useState<any>(null)
  const [claimed, setClaimed] = useState<bigint | null>(null)
  const [depositEth, setDepositEth] = useState('')
  const canAct = isConnected && !!address

  const refresh = async () => {
    const s = await getSummary()
    setSummary(s)
    if (account) {
      setClaimed(await getUserClaimedAmount(account))
    } else {
      setClaimed(null)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const onDeposit = async () => {
    if (!depositEth) return
    const wei = BigInt(Math.floor(Number(depositEth) * 1e18))
    const ok = await deposit(wei)
    if (ok) {
      setDepositEth('')
      refresh()
    }
  }

  const onGrab = async () => {
    const ok = await grabRedPocket()
    if (ok) refresh()
  }
  const onRefund = async () => {
    const ok = await refund()
    if (ok) refresh()
  }
  const onEmergency = async () => {
    const ok = await emergencyStop()
    if (ok) refresh()
  }

  return (
    <section className="p-4 flex flex-col gap-6">
      <Wallet />

      <div className="contract rounded border p-4">
        <div className="mb-3 text-sm text-gray-600">
          合约地址: <span className="font-mono">{address || '-'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>主体 provider: {summary?.provider || '-'}</div>
          <div>总金额(ETH): {formatEth(summary?.totalAmount)}</div>
          <div>红包数量: {summary?.count?.toString?.() || '-'}</div>
          <div>已抢数量: {summary?.claimedCount?.toString?.() || '-'}</div>
          <div>是否均分: {summary?.isEqual ? '是' : '否'}</div>
          <div>合约余额(ETH): {formatEth(summary?.balance)}</div>
          <div>剩余数量: {summary?.remainingCount?.toString?.() || '-'}</div>
          <div>我已领(ETH): {claimed != null ? formatEth(claimed) : '-'}</div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-40"
            placeholder="充值 ETH"
            value={depositEth}
            onChange={(e) => setDepositEth(e.target.value)}
          />
          <Button disabled={!canAct} onClick={onDeposit}>
            充值
          </Button>

          <div className="flex-1" />

          <Button disabled={!canAct} onClick={onGrab}>
            抢红包
          </Button>
          {summary?.provider === account && (
            <>
              <Button disabled={!canAct} onClick={onRefund}>
                退款
              </Button>
              <Button
                disabled={!canAct}
                variant="outline"
                onClick={onEmergency}
              >
                紧急停止
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
