const BN = require('bn.js')
const Citizen = artifacts.require('./Citizen.sol')
const ReserveFund = artifacts.require('./ReserveFund.sol')
const DABankToken = artifacts.require('./DABANKING.sol')
const Wallet = artifacts.require('./Wallet.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BN))
  .should()

function to(promise) {
  return promise.then((data) => {
    return [null, data]
  }).catch((error) => {
    console.log('error form to func:', error)
    try {
      return [JSON.parse(error.message)]
    } catch (e) {
      return [error]
    }
  })
}

function listenEvent(response, eventName, index = 0) {
  assert.equal(response.logs[index].event, eventName, eventName + ' event should fire.');
}

const accountsMap = {}

function getAccounts(accounts) {
  if (!accountsMap.mainAdmin) {
    accountsMap.mainAdmin = accounts[0]
    accountsMap.contractAdmin = accounts[0]
    for (let i = 1; i < accounts.length; i += 1) {
      accountsMap[`user${i}`] = accounts[i]
    }
  }
  return accountsMap
}

async function initContracts(accounts) {
  const { mainAdmin, contractAdmin } = getAccounts(accounts)
  const citizenInstance = await Citizen.new(mainAdmin)
  const walletInstance = await Wallet.new(mainAdmin, citizenInstance.address)
  const reserveFundInstance = await ReserveFund.new(
    citizenInstance.address,
    walletInstance.address,
    mainAdmin,
    currentETHPrice
  )
  const daBankingInstance = await DABankToken.new(reserveFundInstance.address)

  await reserveFundInstance.setDABankingToken(daBankingInstance.address, { from: contractAdmin })
  await citizenInstance.setWalletContract(walletInstance.address, { from: contractAdmin })
  await citizenInstance.setDABankContract(reserveFundInstance.address, { from: contractAdmin })
  await walletInstance.setDABankContract(reserveFundInstance.address, { from: contractAdmin })

  return {
    citizenInstance,
    daBankingInstance,
    reserveFundInstance,
    walletInstance
  }
}

const amount = 0.1
const tokenAmount = 100
const decimal = 10 ** 18
const gasPrice = new BN('20000000000')
const currentETHPrice = 5000000 // $5k
const miningTokenRate = 1000
const lockTakeProfit = 1
const lockBuyToken = 2
const lockBothBuyTokenAndTakeProfit = 3

module.exports = {
  amount,
  BN,
  miningTokenRate,
  currentETHPrice,
  decimal,
  depositedIndex: 1,
  ethValueInWei: web3.utils.toWei('' + amount, 'ether'),
  gasPrice,
  getAccounts,
  initContracts,
  lockTakeProfit,
  lockBuyToken,
  lockBothBuyTokenAndTakeProfit,
  listenEvent,
  to,
  packageValueInDollar: 500000, // $500
  packageValueInToken: tokenAmount * 5 * miningTokenRate, // $500
  profitableBalanceIndex: 2,
  profitSourceBalanceIndex: 3,
  profitBalanceIndex: 4,
  tokenAmount,
  totalDepositedIndex: 0,
  totalProfitedIndex: 5,
  f1DepositedIndex: 0,
  networkDepositedIndex: 1,
  networkDepositedViaETHIndex: 2,
  networkDepositedViaTokenIndex: 3,
  networkDepositedViaDollarIndex: 4
}
