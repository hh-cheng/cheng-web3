import { Tendermint34Client } from '@cosmjs/tendermint-rpc'

import { RPC_URL } from '../../config'

let clientPromise: Promise<Tendermint34Client> | null = null

export function getTmClient() {
  if (!clientPromise) clientPromise = Tendermint34Client.connect(RPC_URL)
  return clientPromise
}

export async function getStatus() {
  return (await getTmClient()).status()
}

export async function getBlockWithID(height?: number) {
  return (await getTmClient()).block(height)
}
