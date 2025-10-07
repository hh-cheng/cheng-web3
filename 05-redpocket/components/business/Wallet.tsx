'use client'
import useWallet from '@hooks/useWallet'
import { formatAddress } from '@lib/utils'
import { Button } from '@/components/ui/button'
import { networks, networkOptions } from '@lib/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Wallet() {
  const {
    chainId,
    account,
    accounts,
    isConnected,
    connect,
    disconnect,
    switchNetwork,
    selectAccount,
  } = useWallet()

  const getNetwork = (chainID: number | null) => {
    if (!chainID) return '未知网络'
    return networks[chainID as keyof typeof networks] || `未知网络: ${chainID}`
  }

  return (
    <section>
      {!isConnected ? (
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            onClick={connect}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            🦊 连接钱包
          </Button>

          <Select
            value={chainId?.toString()}
            onValueChange={(value) => switchNetwork(Number(value))}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="选择网络" />
            </SelectTrigger>
            <SelectContent>
              {networkOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="connected-info bg-gray-100 p-3 rounded-lg">
          <div className="network text-sm text-gray-600 mb-1">
            网络: {getNetwork(chainId)}
          </div>
          <div className="accounts text-sm text-gray-600 mb-1"></div>
          <div className="account flex items-center justify-between">
            <span className="address font-mono text-gray-800">
              {formatAddress(account)}
            </span>

            <div className="flex items-end gap-2">
              <Select
                value={chainId?.toString()}
                onValueChange={(value) => switchNetwork(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择网络" />
                </SelectTrigger>
                <SelectContent>
                  {networkOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={account}
                onValueChange={(value) => selectAccount(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择账户" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((addr) => (
                    <SelectItem key={addr} value={addr}>
                      {formatAddress(addr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={disconnect}
                className="ml-4 bg-gray-600 text-white py-1 px-3 rounded text-sm transition duration-200 cursor-pointer"
              >
                断开
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
