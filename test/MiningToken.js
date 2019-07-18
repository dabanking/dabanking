const util = require('./utils/index')
const {
  amount,
  currentETHPrice,
  decimal,
  ethValueInWei,
  lockBothBuyTokenAndTakeProfit,
  lockBuyToken,
  profitBalanceIndex,
  tokenAmount,
  totalDepositedIndex
} = util
const {
  catchRevertWithReason
} = require("./utils/exceptions.js")


contract('BuyToken', (accounts) => {
  let citizenInstance
  let reserveFundInstance
  let daBankingInstance
  let walletInstance
  const { mainAdmin, user1, user2, user3, user4, user97, user98 } = util.getAccounts(accounts)
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    daBankingInstance = data.daBankingInstance
    reserveFundInstance = data.reserveFundInstance
    walletInstance = data.walletInstance
  })
  describe('BuyToken', () => {
    describe('I. Success', () => {
      it('1. My balances get increased', async() => {
        // 1. user1 register and then buy package
        // 2. user1 invite user2
        // 3. user2 buy package via ETH in 16x admin
        // 4. Make daily profit so user1's C wallet get increased to equal user1's first package
        // 5. user1 buy token from user1's C wallet

        // 1.
        await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        // 2.
        await reserveFundInstance.register('VALID2', user1, { from: user2 })
        // 3.
        await reserveFundInstance.setMaxJoinPackage(parseInt(amount * 16 * currentETHPrice))
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei * 16
          }
        )
        // 4.
        let userWallet = await walletInstance.getUserWallet(user1)
        let totalProfitBalance = 0
        let condition
        let count = 0
        const miningTokenRate = 1000
        await reserveFundInstance.aiSetTokenG2(miningTokenRate)
        do {
          console.log('Simulating make daily profit for day: ', ++count)
          await walletInstance.makeDailyProfit([user1])
          userWallet = await walletInstance.getUserWallet(user1)
          totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
          condition = totalProfitBalance < tokenAmount * miningTokenRate
        } while (condition)
        // 5.
        userWallet = await walletInstance.getUserWallet(user1)
        const profitBalance = userWallet[profitBalanceIndex]
        const userTokenBalanceBefore = await daBankingInstance.balanceOf(user1)
        const dabankTokenBalanceBefore = await daBankingInstance.balanceOf(reserveFundInstance.address)
        const response = await reserveFundInstance.miningToken(
          new util.BN('' + tokenAmount * decimal),
          {
            from: user1
          }
        )
        util.listenEvent(response, 'TokenMined')
        userWallet = await walletInstance.getUserWallet(user1)
        const profitBalance2 = userWallet[profitBalanceIndex]
        profitBalance2.should.be.a.bignumber.that.equals(profitBalance.sub(new util.BN('' + (tokenAmount * miningTokenRate))))

        const userTokenBalanceAfter = await daBankingInstance.balanceOf(user1)
        const dabankTokenBalanceAfter = await daBankingInstance.balanceOf(reserveFundInstance.address)

        userTokenBalanceAfter.should.be.a.bignumber.that.equals(userTokenBalanceBefore.add(new util.BN('' + (tokenAmount * decimal))))
        dabankTokenBalanceAfter.should.be.a.bignumber.that.equals(dabankTokenBalanceBefore.sub(new util.BN('' + (tokenAmount * decimal))))
      })
    })
    describe('II. Fail', () => {
      it('1. Cause by not a user', async () => {
        await catchRevertWithReason(
          reserveFundInstance.miningToken(tokenAmount, { from: user98 }),
          'Please register first'
        )
      })
      it('2. Cause by input invalid values', async () => {
        await catchRevertWithReason(
          reserveFundInstance.miningToken(0),
          'Amount must be > miningDifficulty'
        )
      })
      it('3. Cause by not enough balance', async () => {
        await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
        await catchRevertWithReason(
          reserveFundInstance.miningToken(
            new util.BN('' + tokenAmount * decimal),
            {
              from: user97
            }
          ),
          'You have not enough balance'
        )
      })
      it('4. Cause by buying > 4x of deposited', async() => {
        // 1. user3 register and then buy package
        // 2. user3 invite user4
        // 3. user4 buy package via ETH in 16x admin
        // 4. Make daily profit so user3's C wallet get increased to equal user3's totalDeposited
        // 5. user3 buy token from user3's C wallet

        // 1.
        await reserveFundInstance.register('VALID3', mainAdmin, { from: user3 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user3,
          {
            from: user3,
            value: ethValueInWei
          }
        )
        // 2.
        await reserveFundInstance.register('VALID4', user3, { from: user4 })
        // 3.
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user4,
          {
            from: user4,
            value: ethValueInWei * 16
          }
        )
        // 4.
        let userWallet = await walletInstance.getUserWallet(user3)
        const totalDeposited = userWallet[totalDepositedIndex].toNumber()
        let totalProfitBalance = 0
        let condition
        let count = 0
        do {
          console.log('Simulating make daily profit for day: ', ++count)
          await walletInstance.makeDailyProfit([user3])
          userWallet = await walletInstance.getUserWallet(user3)
          totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
          condition = totalProfitBalance < 4.1 * totalDeposited
        } while (condition)
        // 5.
        await catchRevertWithReason(reserveFundInstance.miningToken(
          new util.BN('' + (totalDeposited * 4 / 1000 + 1)).mul(new util.BN('' + decimal)),
          {
            from: user3
          }
        ), 'You can only mine maximum 4x of your total deposited')
      })
      it('5. Cause by user get locked from mining token', async () => {
        let userWallet = await walletInstance.getUserWallet(user3)
        const totalDeposited = userWallet[totalDepositedIndex].toNumber()
        await reserveFundInstance.lockAccounts([user3], lockBuyToken)
        await catchRevertWithReason(reserveFundInstance.miningToken(
          new util.BN('' + (totalDeposited / 1000)).mul(new util.BN('' + decimal)),
          {
            from: user3
          }
        ), 'Your account get locked from mining token')
      })
      it('6. Cause by user get locked from both mining token and take profit', async () => {
        let userWallet = await walletInstance.getUserWallet(user3)
        const totalDeposited = userWallet[totalDepositedIndex].toNumber()
        await reserveFundInstance.lockAccounts([user3], lockBothBuyTokenAndTakeProfit)
        await catchRevertWithReason(reserveFundInstance.miningToken(
          new util.BN('' + (totalDeposited / 1000)).mul(new util.BN('' + decimal)),
          {
            from: user3
          }
        ), 'Your account get locked from mining token')
      })
    })
  })
})
