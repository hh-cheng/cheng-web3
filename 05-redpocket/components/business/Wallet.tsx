'use client'
import useWallet from '@hooks/useWallet'
import { networks } from '@lib/constants'
import { formatAddress } from '@lib/utils'
import { Button } from '@/components/ui/button'

export default function Wallet() {
  const {
    signer,
    account,
    chainId,
    provider,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useWallet()

  const getNetwork = (chainID: number | null) => {
    if (!chainID) return '未知网络'
    return networks[chainID as keyof typeof networks] || `未知网络: ${chainID}`
  }

  return (
    <section>
      {!isConnected ? (
        <Button
          variant="outline"
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          🦊 连接钱包
        </Button>
      ) : (
        <div className="connected-info bg-gray-100 p-3 rounded-lg">
          <div className="network text-sm text-gray-600 mb-1">
            网络: {getNetwork(chainId)}
          </div>
          <div className="account flex items-center justify-between">
            <span className="address font-mono text-gray-800">
              {formatAddress(account)}
            </span>
            <Button
              variant="outline"
              onClick={disconnectWallet}
              className="ml-4 bg-gray-500 hover:bg-gray-700 text-white py-1 px-3 rounded text-sm transition duration-200"
            >
              断开
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
