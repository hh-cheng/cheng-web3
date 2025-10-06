'use client'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { ethers, type JsonRpcSigner, type BrowserProvider } from 'ethers'

interface WalletState {
  account: string
  isConnected: boolean
  chainId: number | null
  signer: JsonRpcSigner | null
  provider: BrowserProvider | null
}

interface UseWalletReturn extends WalletState {
  disconnectWallet(): void
  connectWallet(): Promise<boolean>
}

export default function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)

  //* --- 连接钱包和初始化 provider 和 signer ---
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请先安装 MetaMask 钱包或其他以太坊钱包扩展，后再刷新页面')
      return false
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts.length) {
        throw new Error('用户拒绝了连接请求')
      }

      await initializeProviderAndSigner(accounts[0])
      setupEventListeners()
      return true
    } catch (err: any) {
      console.error('连接钱包失败', err)
      toast.error(err.message)
      return false
    }
  }

  const disconnectWallet = () => {
    setAccount('')
    setChainId(null)
    setSigner(null)
    setProvider(null)
    setIsConnected(false)
    window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
    window.ethereum?.removeListener('chainChanged', handleChainChanged)
  }

  const initializeProviderAndSigner = async (accountAddress: string) => {
    if (!window.ethereum) return

    const web3Provider = new ethers.BrowserProvider(window.ethereum)
    const network = await web3Provider.getNetwork()
    const web3Signer = await web3Provider.getSigner()

    setIsConnected(true)
    setSigner(web3Signer)
    setProvider(web3Provider)
    setAccount(accountAddress)
    setChainId(Number(network.chainId))
  }

  //* --- 处理账户变更 ---
  //* 连接账户变更
  const handleAccountsChanged = (accounts: string[]) => {
    if (!handleAccountsChanged.length) disconnectWallet()
    else {
      setAccount(accounts[0])
      initializeProviderAndSigner(accounts[0])
    }
  }

  //* 连接网络变更
  const handleChainChanged = (chainIDHex: string) => {
    const newChanID = parseInt(chainIDHex, 16)
    setChainId(newChanID)
    console.log('连接网络变更', newChanID)
    toast.success(`已连接到网络: ${newChanID}`)
  }

  const setupEventListeners = () => {
    if (!window.ethereum) return
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
  }

  //* --- 检查钱包连接状态 ---
  const checkIsWalletConnected = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请先安装 MetaMask 钱包，后再刷新页面')
      return
    }

    try {
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_accounts',
      })

      if (accounts.length > 0) {
        await initializeProviderAndSigner(accounts[0])
      }
    } catch (err) {
      console.error('检查钱包连接状态失败', err)
      toast.error('检查钱包连接状态失败')
    }
  }

  useEffect(() => {
    checkIsWalletConnected()
  }, [])

  return {
    signer,
    account,
    chainId,
    provider,
    isConnected,
    connectWallet,
    disconnectWallet,
  }
}
