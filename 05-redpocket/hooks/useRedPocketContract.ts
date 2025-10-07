'use client'
import { toast } from 'sonner'
import { useMemo } from 'react'
import { ethers, type BrowserProvider, type JsonRpcSigner } from 'ethers'

import useWallet from '@hooks/useWallet'

// Minimal ABI for RedPocket features we use
const RED_POCKET_ABI = [
  'function provider() view returns (address)',
  'function totalAmount() view returns (uint256)',
  'function count() view returns (uint256)',
  'function claimedCount() view returns (uint256)',
  'function isEqual() view returns (bool)',
  'function getBalance() view returns (uint256)',
  'function getRemainingCount() view returns (uint256)',
  'function redPocketMap(address) view returns (uint256)',
  'function deposit() payable',
  'function grabRedPocket()',
  'function refund()',
  'function emergencyStop()',
  'event RedPocketCreated(address indexed provider, uint256 amount, uint256 count, bool isEqual)',
  'event RedPocketClaimed(address indexed claimer, uint256 amount)',
  'event RedPocketFinished(uint256 remainingAmount)',
  'event RedPocketRefunded(uint256 amount)',
]

type RedPocketSummary = {
  provider: string
  totalAmount: bigint
  count: bigint
  claimedCount: bigint
  isEqual: boolean
  balance: bigint
  remainingCount: bigint
}

export default function useRedPocketContract() {
  const { provider, signer } = useWallet()

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

  const contract: any | null = useMemo(() => {
    try {
      const rpc: BrowserProvider | JsonRpcSigner | null = signer || provider
      if (!rpc || !contractAddress) return null
      return new ethers.Contract(contractAddress, RED_POCKET_ABI, rpc)
    } catch (err) {
      console.error('创建合约实例失败', err)
      return null
    }
  }, [provider, signer, contractAddress])

  const ensureSigner = (): any | null => {
    if (!contract) {
      toast.error('合约未就绪，稍后重试')
      return null
    }
    // When signer exists, ethers returns a Contract already connected to signer
    if (!signer) {
      toast.error('需要连接钱包才能执行此操作')
      return null
    }
    return contract.connect(signer) as any
  }

  // --- Reads ---
  const getSummary = async (): Promise<RedPocketSummary | null> => {
    try {
      if (!contract) return null
      const [prov, total, cnt, claimed, eq, bal, remain] = await Promise.all([
        contract.provider(),
        contract.totalAmount(),
        contract.count(),
        contract.claimedCount(),
        contract.isEqual(),
        contract.getBalance(),
        contract.getRemainingCount(),
      ])
      return {
        provider: prov as string,
        totalAmount: total as bigint,
        count: cnt as bigint,
        claimedCount: claimed as bigint,
        isEqual: Boolean(eq),
        balance: bal as bigint,
        remainingCount: remain as bigint,
      }
    } catch (err) {
      console.error('读取合约信息失败', err)
      toast.error('读取合约信息失败')
      return null
    }
  }

  const getUserClaimedAmount = async (
    address: string,
  ): Promise<bigint | null> => {
    try {
      if (!contract) return null
      const amount: bigint = await contract.redPocketMap(address)
      return amount
    } catch (err) {
      console.error('读取用户红包金额失败', err)
      toast.error('读取用户红包金额失败')
      return null
    }
  }

  // --- Writes ---
  const deposit = async (valueWei: bigint) => {
    const c = ensureSigner()
    if (!c) return false
    try {
      const tx = await c.deposit({ value: valueWei })
      await tx.wait()
      toast.success('充值成功')
      return true
    } catch (err: any) {
      console.error('充值失败', err)
      toast.error(err?.message || '充值失败')
      return false
    }
  }

  const grabRedPocket = async () => {
    const c = ensureSigner()
    if (!c) return false
    try {
      const tx = await c.grabRedPocket()
      await tx.wait()
      toast.success('抢红包成功')
      return true
    } catch (err: any) {
      console.error('抢红包失败', err)
      toast.error(err?.message || '抢红包失败')
      return false
    }
  }

  const refund = async () => {
    const c = ensureSigner()
    if (!c) return false
    try {
      const tx = await c.refund()
      await tx.wait()
      toast.success('退款成功')
      return true
    } catch (err: any) {
      console.error('退款失败', err)
      toast.error(err?.message || '退款失败')
      return false
    }
  }

  const emergencyStop = async () => {
    const c = ensureSigner()
    if (!c) return false
    try {
      const tx = await c.emergencyStop()
      await tx.wait()
      toast.success('紧急停止已执行')
      return true
    } catch (err: any) {
      console.error('紧急停止失败', err)
      toast.error(err?.message || '紧急停止失败')
      return false
    }
  }

  return {
    address: contractAddress,
    contract,
    getSummary,
    getUserClaimedAmount,
    deposit,
    grabRedPocket,
    refund,
    emergencyStop,
  }
}
