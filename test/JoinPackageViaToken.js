const util = require('./utils/index')
const {
  amount,
  miningTokenRate,
  currentETHPrice,
  decimal,
  depositedIndex,
  ethValueInWei,
  packageValueInToken,
  profitBalanceIndex,
  profitableBalanceIndex,
  profitSourceBalanceIndex,
  tokenAmount,
  totalDepositedIndex,
  networkDepositedViaTokenIndex
} = util
const {
  catchRevertWithReason
} = require("./utils/exceptions.js")


contract('Wallet', (accounts) => {
  let citizenInstance
  let reserveFundInstance
  let daBankingInstance
  let walletInstance
  const {
    mainAdmin,
    user1,
    user2,
    user3,
    user4,
    user97,
    user98
  } = util.getAccounts(accounts)
  before(async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    reserveFundInstance = data.reserveFundInstance
    daBankingInstance = data.daBankingInstance
    walletInstance = data.walletInstance
  })
  describe('BuyPackageViaToken', () => {
    describe('I. Success', () => {
      it('1. My balances get increased', async () => {
        // 1. user1 register and then buy package
        // 2. user1 invite user2
        // 3. user2 buy package via ETH in 16x admin
        // 4. Make daily profit so user1's C wallet get increased to equal user1's first package
        // 5. user1 buy token
        // 6. user1 buy package via token

        // 1.
        await reserveFundInstance.register('VALID1', mainAdmin, {from: user1})
        await reserveFundInstance.setMaxJoinPackage(parseInt(amount * 160 * currentETHPrice))
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        // 2.
        await reserveFundInstance.register('VALID2', user1, {from: user2})
        // 3.
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
        const firstDeposited = userWallet[depositedIndex][0].toNumber()
        let totalProfitBalance = 0
        let condition
        let count = 0
        do {
          console.log('Simulating make daily profit for day: ', ++count)
          await walletInstance.makeDailyProfit([user1])
          userWallet = await walletInstance.getUserWallet(user1)
          totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
          condition = totalProfitBalance < firstDeposited * 2
        } while (condition)

        // 5.
        await reserveFundInstance.aiSetTokenG2(miningTokenRate) // 1token = $1
        await reserveFundInstance.aiSetTokenG3(currentETHPrice / 1000) // so that 1eth = 5000 tokens
        const tokenAmountToBuy = new util.BN('' + tokenAmount * 10).mul(new util.BN('' + decimal))  // $1000 we'll use 500 in this test case and 500 in the next
        await reserveFundInstance.miningToken(
          tokenAmountToBuy,
          {
            from: user1
          }
        )

        // 6.
        userWallet = await walletInstance.getUserWallet(user1)
        const deposited = userWallet[depositedIndex]
        const totalDeposited = userWallet[totalDepositedIndex]
        const profitableBalance = userWallet[profitableBalanceIndex]
        const profitSourceBalance = userWallet[profitSourceBalanceIndex]
        const userTokenBalanceBefore = await daBankingInstance.balanceOf(user1)
        const dabankTokenBalanceBefore = await daBankingInstance.balanceOf(reserveFundInstance.address)
        await daBankingInstance.approve(
          reserveFundInstance.address,
          tokenAmountToBuy,
          {
            from: user1
          }
        )
        const response = await reserveFundInstance.joinPackageViaToken(
          packageValueInToken,
          user1,
          {
            from: user1
          }
        )
        util.listenEvent(response, 'PackageJoinedViaToken')
        const userTokenBalanceAfter = await daBankingInstance.balanceOf(user1)
        const dabankTokenBalanceAfter = await daBankingInstance.balanceOf(reserveFundInstance.address)

        userTokenBalanceAfter.should.be.a.bignumber.that.equals(userTokenBalanceBefore.sub(new util.BN('' + tokenAmount * 5).mul(new util.BN('' + decimal))))
        dabankTokenBalanceAfter.should.be.a.bignumber.that.equals(dabankTokenBalanceBefore.add(new util.BN('' + tokenAmount * 4.5).mul(new util.BN('' + decimal)))) // transfered 10% to mainAdmin

        userWallet = await walletInstance.getUserWallet(user1)
        const deposited2 = userWallet[depositedIndex]
        const totalDeposited2 = userWallet[totalDepositedIndex]
        const profitableBalance2 = userWallet[profitableBalanceIndex]
        const profitSourceBalance2 = userWallet[profitSourceBalanceIndex]
        assert.equal(deposited2.length, deposited.length + 1)
        totalDeposited2.should.be.a.bignumber.that.equals(totalDeposited.add(new util.BN('' + packageValueInToken)))
        profitableBalance2.should.be.a.bignumber.that.equals(profitableBalance.add(new util.BN('' + packageValueInToken)))
        profitSourceBalance2.should.be.a.bignumber.that.equals(profitSourceBalance.add(new util.BN(`${packageValueInToken * 8}`)))
      })
      it('2. Admin should receive 10% of token that user use to buy', async () => {
        // This test is depends on No. 1
        const mainAdminTokenBalanceBefore = await daBankingInstance.balanceOf(mainAdmin)
        await reserveFundInstance.joinPackageViaToken(
          packageValueInToken,
          user1,
          {
            from: user1
          }
        )
        const mainAdminTokenBalanceAfter = await daBankingInstance.balanceOf(mainAdmin)
        mainAdminTokenBalanceAfter.should.be.a.bignumber.that.equals(mainAdminTokenBalanceBefore.add(new util.BN('' + tokenAmount * 0.5).mul(new util.BN('' + decimal))))
      })

      it('3. My inviters should get increased the f1Deposited, networkDeposited & networkDepositedViaToken value', async () => {
        // This test is depends on No.1
        // 1. user3 register under user1 and then buy package
        // 2. user3 invite user4
        // 3. user4 buy package via ETH in 16x user3
        // 4. Make daily profit so user3's C wallet get increased to equal user3's first package
        // 5. user3 buy token
        // 6. user3 buy package via token
        // 7. check user1 and mainAdmin balances get increased

        // 1.
        await reserveFundInstance.register('VALID3', user1, { from: user3 })
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
        await reserveFundInstance.setMaxJoinPackage(parseInt(amount * 16 * currentETHPrice + 3))
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
        const firstDeposited = userWallet[depositedIndex][0].toNumber()
        let totalProfitBalance = 0
        let condition
        let count = 0
        do {
          console.log('Simulating make daily profit for day: ', ++count)
          await walletInstance.makeDailyProfit([user3])
          userWallet = await walletInstance.getUserWallet(user3)
          totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
          condition = totalProfitBalance < firstDeposited * 2
        } while (condition)

        // 5.
        const tokenAmountToBuy = new util.BN('' + tokenAmount * 10).mul(new util.BN('' + decimal))  // $1000 we'll use 500 in this test case and 500 in the next
        await reserveFundInstance.miningToken(
          tokenAmountToBuy,
          {
            from: user3
          }
        )

        // 6.
        await daBankingInstance.approve(
          reserveFundInstance.address,
          tokenAmountToBuy,
          {
            from: user3
          }
        )

        const user1F1DepositedBefore = await citizenInstance.getF1Deposited(user1)
        const user1NetworkDepositedBefore = await citizenInstance.getNetworkDeposited(user1)
        const mainAdminNetworkDepositedBefore = await citizenInstance.getNetworkDeposited(mainAdmin)
        let mainAdminDepositInfo = await citizenInstance.getDepositInfo(mainAdmin)
        const mainAdminNetworkDepositedViaTokenBefore = mainAdminDepositInfo[networkDepositedViaTokenIndex]
        let user1DepositInfo = await citizenInstance.getDepositInfo(user1)
        const user1NetworkDepositedViaTokenBefore = user1DepositInfo[networkDepositedViaTokenIndex]
        await reserveFundInstance.joinPackageViaToken(
          packageValueInToken,
          user3,
          {
            from: user3
          }
        )
        const user1F1DepositedAfter = await citizenInstance.getF1Deposited(user1)
        const user1NetworkDepositedAfter = await citizenInstance.getNetworkDeposited(user1)

        user1F1DepositedAfter.should.be.bignumber.that.equals(user1F1DepositedBefore.add(new util.BN('' + packageValueInToken)))
        user1NetworkDepositedAfter.should.be.bignumber.that.equals(user1NetworkDepositedBefore.add(new util.BN('' + packageValueInToken)))

        const mainAdminNetworkDepositedAfter = await citizenInstance.getNetworkDeposited(mainAdmin)
        mainAdminNetworkDepositedAfter.should.be.bignumber.that.equals(mainAdminNetworkDepositedBefore.add(new util.BN('' + packageValueInToken)))

        mainAdminDepositInfo = await citizenInstance.getDepositInfo(mainAdmin)
        const mainAdminNetworkDepositedViaTokenAfter = mainAdminDepositInfo[networkDepositedViaTokenIndex]
        mainAdminNetworkDepositedViaTokenAfter.should.be.bignumber.that.equals(mainAdminNetworkDepositedViaTokenBefore.add(new util.BN('' + tokenAmount * 5).mul(new util.BN('' + decimal))))
        user1DepositInfo = await citizenInstance.getDepositInfo(user1)
        const user1NetworkDepositedViaTokenAfter = user1DepositInfo[networkDepositedViaTokenIndex]
        user1NetworkDepositedViaTokenAfter.should.be.bignumber.that.equals(user1NetworkDepositedViaTokenBefore.add(new util.BN('' + tokenAmount * 5).mul(new util.BN('' + decimal))))
      })
    })
    describe('II. Fail', () => {
      it('1. Cause by not a user', async () => {
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaToken(packageValueInToken, user98),
          'You can only buy for an exists member'
        )
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaToken(packageValueInToken, mainAdmin, { from: user98}),
          'Please register first'
        )
      })
      it('2. Cause by input invalid values', async () => {
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaToken(0, mainAdmin),
          'Amount must be > 0'
        )
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaToken(packageValueInToken * 1000, mainAdmin),
          'Can not join with amount that greater max join package'
        )
      })
      it('3. Cause by first buy < 200', async () => {
        await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaToken(
            1,
            user97,
            {
              from: user97
            }
          ),
          'Minimum for first join is $200'
        )
      })
    })
  })
})
