'use client'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { ethers, type JsonRpcSigner, type BrowserProvider } from 'ethers'

export default function useWallet() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState<number | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [accounts, setAccounts] = useState<string[]>([])
  const isConnected = Boolean(account && provider && signer)

  //* --- 连接钱包和初始化 provider 和 signer ---
  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请先安装 MetaMask 钱包或其他以太坊钱包扩展，后再刷新页面')
      return false
    }

    try {
      // 连接钱包
      const nextAccounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!nextAccounts.length) {
        throw new Error('用户拒绝了连接请求')
      }

      setAccounts(nextAccounts)
      await initializeProviderAndSigner(nextAccounts[0])
      setAccount(nextAccounts[0])
      return true
    } catch (err: any) {
      console.error('连接钱包失败', err)
      toast.error(err.message)
      return false
    }
  }

  const disconnect = () => {
    setAccount('')
    setChainId(null)
    setSigner(null)
    setProvider(null)
    setAccounts([])
    window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
    window.ethereum?.removeListener('chainChanged', handleChainChanged)
  }

  const initializeProviderAndSigner = async (accountAddress: string) => {
    if (!window.ethereum) return

    const web3Provider = new ethers.BrowserProvider(window.ethereum)
    const network = await web3Provider.getNetwork()
    const web3Signer = await web3Provider.getSigner()

    setSigner(web3Signer)
    setProvider(web3Provider)
    setAccount(accountAddress)
    setChainId(Number(network.chainId))
  }

  //* --- 处理账户变更 ---
  //* 连接账户变更（EIP-1193 会传入账户数组）
  const handleAccountsChanged = (eventAccounts: string[]) => {
    if (!eventAccounts || eventAccounts.length === 0) {
      disconnect()
      return
    }
    const nextAccount = eventAccounts[0]
    setAccounts(eventAccounts)
    setAccount(nextAccount)
    initializeProviderAndSigner(nextAccount)
  }

  //* 连接网络变更（EIP-1193 以 0x 开头的十六进制字符串传入）
  const handleChainChanged = async (chainIdHex: string) => {
    // 将 0x 十六进制链 ID 转为十进制数字
    const nextChainId = Number.parseInt(chainIdHex, 16)
    setChainId(nextChainId)
    console.log('连接网络变更', chainIdHex, nextChainId)
    // 重新初始化 provider/signer 以绑定到新网络
    if (account) {
      await initializeProviderAndSigner(account)
    }
    toast.success(`已连接到网络: ${nextChainId}`)
  }

  //* --- 切换网络 ---
  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) {
      toast.error('未检测到以太坊钱包')
      return false
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      return true
    } catch (err: any) {
      // 4902: Unrecognized chain – 需要先添加网络
      if (err?.code === 4902) {
        toast.error('当前钱包未添加该网络，请先在钱包中添加')
      } else {
        toast.error(err?.message || '切换网络失败')
      }
      return false
    }
  }

  //* --- 检查钱包连接状态 ---
  const checkIsWalletConnected = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请先安装 MetaMask 钱包，后再刷新页面')
      return
    }

    try {
      const existingAccounts: string[] = await window.ethereum.request({
        method: 'eth_accounts',
      })

      if (existingAccounts.length > 0) {
        setAccounts(existingAccounts)
        await initializeProviderAndSigner(existingAccounts[0])
      }
    } catch (err) {
      console.error('检查钱包连接状态失败', err)
      toast.error('检查钱包连接状态失败')
    }
  }

  //* --- 手动选择当前账户 ---
  const selectAccount = async (address: string) => {
    if (!window.ethereum) return false
    // 更新本地选择，provider/signer 会基于当前账号重新获取
    if (!accounts.includes(address)) return false
    setAccount(address)
    await initializeProviderAndSigner(address)
    return true
  }

  useEffect(() => {
    checkIsWalletConnected()
    if (!window.ethereum) return
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  return {
    signer,
    account,
    chainId,
    provider,
    accounts,
    isConnected,
    connect,
    disconnect,
    switchNetwork,
    selectAccount,
  }
}
