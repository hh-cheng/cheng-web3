'use strict'

const RedPocket = artifacts.require('RedPocket')

module.exports = async function (deployer, network) {
  const count = parseInt(process.env.REDPOCKET_COUNT || '5', 10)
  const isEqual =
    (process.env.REDPOCKET_EQUAL || 'true').toLowerCase() === 'true'
  const fundEther = process.env.REDPOCKET_FUND_ETHER || '0.01'

  const value = web3.utils.toWei(fundEther, 'ether')

  console.log(`\nDeploying RedPocket to ${network}...`)
  console.log(`- count: ${count}`)
  console.log(`- isEqual: ${isEqual}`)
  console.log(`- fund: ${fundEther} ETH`)

  await deployer.deploy(RedPocket, count, isEqual, { value })
}
