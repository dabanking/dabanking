const times = require('apr-times').default
const util = require('./utils/index')

const Citizen = artifacts.require('./Citizen.sol')
const ReserveFund = artifacts.require('./ReserveFund.sol')
const DABankToken = artifacts.require('./DABANKING.sol')
const Wallet = artifacts.require('./Wallet.sol')

const {
  catchRevertWithReason
} = require("./utils/exceptions.js")

const {
  ethValueInWei,
  profitBalanceIndex
} = util
const currentETHPrice = 10000000000 // $10m

async function initContracts(accounts) {
  const { mainAdmin, contractAdmin } = util.getAccounts(accounts)
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

contract('IReserveFund', (accounts) => {
  const {
    mainAdmin,
    user1,
    user2,
    user3,
    user4,
    user20,
    user30,
    user40,
  } = util.getAccounts(accounts)
  let reserveFundInstance
  let citizenInstance
  let walletInstance
  before( async () => {
    const data = await initContracts(accounts)
    reserveFundInstance = data.reserveFundInstance
    citizenInstance = data.citizenInstance
    walletInstance = data.walletInstance
  })

  describe('Ranking', async () => {
    describe('I. Fail', () => {
      it('1. cause by not meet condition to make ranking' , async () => {
        await catchRevertWithReason(citizenInstance.updateRanking({ from: user1 }), 'Invalid condition to make ranking')
      })
    })
    describe('II. Success', () => {
      it('1. Should have UnRanked rank on new member', async() => {
        const adminRank = await citizenInstance.getRank(mainAdmin)
        adminRank.toNumber().should.equal(0)
      })
      it('2. Should get new rank when qualified', async () => {
        // 1. user1 invite user2, user3, user4
        // 2. user2 invite user20, user3 invite user30, user4 invite user40
        // 3. user2, user3, user4 buy $200 each , user20, user30 buy $2000 each, user40 buy $1000
        // 4. call updateRanking
        // 5. check user1 rank

        // 1
        await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
        await reserveFundInstance.register('VALID2', user1, { from: user2 })
        await reserveFundInstance.register('VALID3', user1, { from: user3 })
        await reserveFundInstance.register('VALID4', user1, { from: user4 })
        await reserveFundInstance.register('VALID20', user2, { from: user20 })
        await reserveFundInstance.register('VALID30', user3, { from: user30 })
        await reserveFundInstance.register('VALID40', user4, { from: user40 })

        // 2
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei / 5000
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user3,
          {
            from: user3,
            value: ethValueInWei / 5000
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user4,
          {
            from: user4,
            value: ethValueInWei / 5000
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user20,
          {
            from: user20,
            value: ethValueInWei / 500
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user30,
          {
            from: user30,
            value: ethValueInWei / 500
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user40,
          {
            from: user40,
            value: ethValueInWei / 1000
          }
        )

        // 3
        citizenInstance.updateRanking({ from: user1 })

        // 4
        const user1Rank = await citizenInstance.getRank(user1)
        user1Rank.toNumber().should.equal(1)
      })
      it('3. Should get bonus of $1k when reaching rank4', async () => {
        // This test is depend on No. 2
        // 1. user20, user30 buy $50k each, user40 buy $40k
        // 2. call updateRanking
        // 3. check user1 bonus

        // 1
        await reserveFundInstance.setMaxJoinPackage(currentETHPrice / 20); // $50k
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user20,
          {
            from: user20,
            value: ethValueInWei / 20
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user30,
          {
            from: user30,
            value: ethValueInWei / 20
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user40,
          {
            from: user40,
            value: ethValueInWei / 25
          }
        )

        // 2
        let user1Wallet = await walletInstance.getUserWallet(user1)
        const profitBalanceBefore = user1Wallet[profitBalanceIndex]
        citizenInstance.updateRanking({ from: user1 })

        // 3
        const user1Rank = await citizenInstance.getRank(user1)
        user1Rank.toNumber().should.equal(4)

        user1Wallet = await walletInstance.getUserWallet(user1)
        const profitBalanceAfter = user1Wallet[profitBalanceIndex]
        const rankBonus = 1000000
        profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore.add(new util.BN('' + rankBonus)))
      })
      it('4. Should get bonus of $500k when reaching rank10', async () => {
        // This test is depend on No. 3
        // 1. user20, user30 buy $10m each, user40 buy $10m
        // 2. call updateRanking
        // 3. check user1 bonus

        // 1
        await reserveFundInstance.setMaxJoinPackage(currentETHPrice); // $10m
        await times(9, async () => {
          await reserveFundInstance.joinPackageViaEther(
            currentETHPrice,
            user20,
            {
              from: user20,
              value: ethValueInWei
            }
          )
          await reserveFundInstance.joinPackageViaEther(
            currentETHPrice,
            user30,
            {
              from: user30,
              value: ethValueInWei
            }
          )
          await reserveFundInstance.joinPackageViaEther(
            currentETHPrice,
            user40,
            {
              from: user40,
              value: ethValueInWei
            }
          )
        })
        citizenInstance.updateRanking({ from: user1 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user20,
          {
            from: user20,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user30,
          {
            from: user30,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user40,
          {
            from: user40,
            value: ethValueInWei
          }
        )

        // 2
        let user1Wallet = await walletInstance.getUserWallet(user1)
        const profitBalanceBefore = user1Wallet[profitBalanceIndex]
        citizenInstance.updateRanking({ from: user1 })

        // 3
        const user1Rank = await citizenInstance.getRank(user1)
        user1Rank.toNumber().should.equal(10)

        user1Wallet = await walletInstance.getUserWallet(user1)
        const profitBalanceAfter = user1Wallet[profitBalanceIndex]
        const rankBonus = 500000000
        profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore.add(new util.BN('' + rankBonus)))
      })
    })
  })
})
