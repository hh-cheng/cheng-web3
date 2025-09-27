import 'dotenv/config'
import fs from 'fs/promises'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { GasPrice, SigningStargateClient } from '@cosmjs/stargate'

console.log(process.env.MNEMONIC)

async function main() {
  // 1.配置区块链基本信息
  const RPC = 'http://localhost:26657'
  const PREFIX = 'wasm'
  const DENOM = 'ucosm'
  const GAS_PRICE = GasPrice.fromString(`0.25${DENOM}`)
  // const CREATOR_MNEMONIC = process.env.MNEMONIC.trim() // 助记词
  const CREATOR_MNEMONIC =
    'journey defense jump dance confirm wrong train video inflict eager aunt tragic'
  if (!CREATOR_MNEMONIC)
    throw new Error('Set MNEMONIC env var to a valid BIP39 mnemonic')
  const wordCount = CREATOR_MNEMONIC.split(/\s+/).length
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    throw new Error(`MNEMONIC must be 12/15/18/21/24 words, got ${wordCount}`)
  }
  // https://github.com/CosmWasm/cw-plus/releases
  const CW20_WASM_PATH = './cw20_base.wasm'

  // 2.作为创作者，初始化钱包
  let creatorWallet: DirectSecp256k1HdWallet
  try {
    creatorWallet = await DirectSecp256k1HdWallet.fromMnemonic(
      CREATOR_MNEMONIC,
      { prefix: PREFIX },
    )
  } catch (e: any) {
    throw new Error(
      `Invalid BIP39 mnemonic: ${e?.message ?? e}. Ensure lowercase words, single spaces, and a valid checksum.`,
    )
  }
  const [creator] = await creatorWallet.getAccounts()
  const wasmClient = await SigningCosmWasmClient.connectWithSigner(
    RPC,
    creatorWallet,
    { gasPrice: GAS_PRICE },
  )

  // 3.创建代币，上传和初始化 CW20
  const wasm = await fs.readFile(CW20_WASM_PATH)
  const uploadRes = await wasmClient.upload(creator.address, wasm, 'auto')
  const codeId = uploadRes.codeId

  // 初始化原始资产
  const tokenName = 'MyToken'
  const tokenSymbol = 'DEMO'
  const tokenDecimals = 6
  const initialSupply = '1000000000' // 1,000 DEMO with 6 decimals
  const initMsg = {
    name: tokenName,
    symbol: tokenSymbol,
    decimals: tokenDecimals,
    mint: { minter: creator.address },
    initial_balances: [{ address: creator.address, amount: initialSupply }],
  }

  const instantiateRes = await wasmClient.instantiate(
    creator.address,
    codeId,
    initMsg,
    'demo-cw20',
    'auto',
  )
  const contractAddress = instantiateRes.contractAddress
  console.log('CW20 contract', contractAddress)

  // 4.创建用户: 创建一个新地址
  const userWallet = await DirectSecp256k1HdWallet.generate(12, {
    prefix: PREFIX,
  })
  const [user] = await userWallet.getAccounts()
  console.log('New user address', user.address)

  // 5.转账，给用户 CW20 代币
  await wasmClient.execute(
    creator.address,
    contractAddress,
    {
      transfer: { recipient: user.address, amount: '12345' }, // 0.012345 DEMO
    },
    'auto',
    'transfer DEMO to user',
  )
  const userBal1 = await wasmClient.queryContractSmart(contractAddress, {
    balance: { address: user.address },
  })
  console.log('User balance after transfer', userBal1)

  // 6.模拟挖矿，给用户分配 cw20 代币
  await wasmClient.execute(
    creator.address,
    contractAddress,
    { mint: { recipient: user.address, amount: '500000' } }, // 0.5 DEMO
    'auto',
    'mint (mine) tokens to user',
  )
  const userBal2 = await wasmClient.queryContractSmart(contractAddress, {
    balance: { address: user.address },
  })
  console.log('User balance after mint:', userBal2)

  // 7.给用户发送一些代币让他们在后续可以自己进行交易
  const bankClient = await SigningStargateClient.connectWithSigner(
    RPC,
    creatorWallet,
    { gasPrice: GAS_PRICE },
  )
  await bankClient.sendTokens(
    creator.address,
    user.address,
    [{ denom: DENOM, amount: '1000000' }],
    'auto',
  )
  console.log('Funded user with native fees')
}

main().catch(console.error)
