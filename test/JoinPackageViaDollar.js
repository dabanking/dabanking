const util = require('./utils/index')
const {
  amount,
  currentETHPrice,
  depositedIndex,
  ethValueInWei,
  packageValueInDollar,
  profitBalanceIndex,
  profitableBalanceIndex,
  profitSourceBalanceIndex,
  totalDepositedIndex
} = util
const {
  catchRevertWithReason
} = require("./utils/exceptions.js")


contract('IReserveFund', (accounts) => {
  let citizenInstance
  let reserveFundInstance
  let walletInstance
  const {
    mainAdmin,
    user1,
    user2,
    user3,
    user4,
    user10,
    user11,
    user97,
    user98
  } = util.getAccounts(accounts)
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    reserveFundInstance = data.reserveFundInstance
    walletInstance = data.walletInstance
  })
  describe('BuyPackageViaDollar', () => {
    describe('I. Success', () => {
      it('1. My balances get increased', async() => {
        // 1. user1 register and then buy package
        // 2. user1 invite user2
        // 3. user2 buy package via ETH in 16x admin
        // 4. Make daily profit so user1's C wallet get increased to equal user1's first package
        // 5. user1 buy package via dollar

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
        const firstDeposited = userWallet[depositedIndex][0].toNumber()
        let totalProfitBalance = 0
        let condition
        let count = 0
        do {
          console.log('Simulating make daily profit for day: ', ++count)
          await walletInstance.makeDailyProfit([user1])
          userWallet = await walletInstance.getUserWallet(user1)
          totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
          condition = totalProfitBalance < firstDeposited
        } while (condition)
        userWallet = await walletInstance.getUserWallet(user1)
        const deposited = userWallet[depositedIndex]
        const totalDeposited = userWallet[totalDepositedIndex]
        const profitableBalance = userWallet[profitableBalanceIndex]
        const profitSourceBalance = userWallet[profitSourceBalanceIndex]
        const response = await reserveFundInstance.joinPackageViaDollar(
          packageValueInDollar,
          user1,
          {
            from: user1
          }
        )
        util.listenEvent(response, 'PackageJoinedViaDollar')
        userWallet = await walletInstance.getUserWallet(user1)
        const deposited2 = userWallet[depositedIndex]
        const totalDeposited2 = userWallet[totalDepositedIndex]
        const profitableBalance2 = userWallet[profitableBalanceIndex]
        const profitSourceBalance2 = userWallet[profitSourceBalanceIndex]
        assert.equal(deposited2.length, deposited.length + 1)
        totalDeposited2.should.be.a.bignumber.that.equals(totalDeposited.add(new util.BN('' + packageValueInDollar)))
        profitableBalance2.should.be.a.bignumber.that.equals(profitableBalance.add(new util.BN('' + packageValueInDollar)))
        profitSourceBalance2.should.be.a.bignumber.that.equals(profitSourceBalance.add(new util.BN(`${packageValueInDollar * 8}`)))
      })
      it('2. Admin should receive 10% of Ether that user use to buy', async () => {
        // This test is depends on No. 1
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
          condition = totalProfitBalance < firstDeposited
        } while (condition)

        let adminWallet = await walletInstance.getUserWallet(mainAdmin)
        const profitBalanceBefore = adminWallet[profitBalanceIndex].toNumber()
        await reserveFundInstance.joinPackageViaDollar(
          packageValueInDollar,
          user1,
          {
            from: user1
          }
        )
        adminWallet = await walletInstance.getUserWallet(mainAdmin)
        const profitBalanceAfter = adminWallet[profitBalanceIndex].toNumber()
        profitBalanceAfter.should.equals(profitBalanceBefore + (packageValueInDollar * 0.1))
      })
      it('3. My inviters should get increased the f1Deposited & networkDeposited value', async () => {
        // 1. user3 register under user1 and then buy package
        // 2. user3 invite user4
        // 3. user4 buy package via ETH in 16x admin
        // 4. Make daily profit so user3's C wallet get increased to equal user3's first package
        // 5. user3 buy package via dollar
        // 6. check user1 and mainAdmin balances get increased

        // 1.
        await reserveFundInstance.register('VALID3', user1, {from: user3})
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user3,
          {
            from: user3,
            value: ethValueInWei
          }
        )
        // 2.
        await reserveFundInstance.register('VALID4', user3, {from: user4})
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
          condition = totalProfitBalance < firstDeposited
        } while (condition)

        const user1F1DepositedBefore = await citizenInstance.getF1Deposited(user1)
        const user1NetworkDepositedBefore = await citizenInstance.getNetworkDeposited(user1)
        const mainAdminNetworkDepositedBefore = await citizenInstance.getNetworkDeposited(mainAdmin)
        // 5.
        await reserveFundInstance.joinPackageViaDollar(
          packageValueInDollar,
          user3,
          {
            from: user3
          }
        )
        const user1F1DepositedAfter = await citizenInstance.getF1Deposited(user1)
        const user1NetworkDepositedAfter = await citizenInstance.getNetworkDeposited(user1)
        user1F1DepositedAfter.should.be.bignumber.that.equals(user1F1DepositedBefore.add(new util.BN('' + packageValueInDollar)))
        user1NetworkDepositedAfter.should.be.bignumber.that.equals(user1NetworkDepositedBefore.add(new util.BN('' + packageValueInDollar)))

        const mainAdminNetworkDepositedAfter = await citizenInstance.getNetworkDeposited(mainAdmin)
        mainAdminNetworkDepositedAfter.should.be.bignumber.that.equals(mainAdminNetworkDepositedBefore.add(new util.BN('' + packageValueInDollar)))
      })
      it('4. Can buy for my downline', async() => {
        // 1. user10 invite user11
        // 2. Make daily profit so user10's C wallet get increased to equal user10's first package
        // 3. user10 buy package for user11
        await reserveFundInstance.register('VALID10', mainAdmin, {from: user10})
        await reserveFundInstance.register('VALID11', user10, {from: user11})
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user10,
          {
            from: user10,
            value: ethValueInWei * 10
          }
        )
        // 2.
        let userWallet = await walletInstance.getUserWallet(user10)
        let totalProfitBalance = 0
        let condition
        let count = 0
        do {
          console.log('Simulating make daily profit for day: ', ++count)
          await walletInstance.makeDailyProfit([user10])
          userWallet = await walletInstance.getUserWallet(user10)
          totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
          condition = totalProfitBalance < packageValueInDollar
        } while (condition)
        // 3.
        userWallet = await walletInstance.getUserWallet(user11)
        const deposited = userWallet[depositedIndex]
        const totalDeposited = userWallet[totalDepositedIndex]
        const profitableBalance = userWallet[profitableBalanceIndex]
        const profitSourceBalance = userWallet[profitSourceBalanceIndex]
        const response = await reserveFundInstance.joinPackageViaDollar(
          packageValueInDollar,
          user11,
          {
            from: user10
          }
        )
        util.listenEvent(response, 'PackageJoinedViaDollar')
        userWallet = await walletInstance.getUserWallet(user11)
        const deposited2 = userWallet[depositedIndex]
        const totalDeposited2 = userWallet[totalDepositedIndex]
        const profitableBalance2 = userWallet[profitableBalanceIndex]
        const profitSourceBalance2 = userWallet[profitSourceBalanceIndex]
        assert.equal(deposited2.length, deposited.length + 1)
        totalDeposited2.should.be.a.bignumber.that.equals(totalDeposited.add(new util.BN('' + packageValueInDollar)))
        profitableBalance2.should.be.a.bignumber.that.equals(profitableBalance.add(new util.BN('' + packageValueInDollar * 2)))
        profitSourceBalance2.should.be.a.bignumber.that.equals(profitSourceBalance.add(new util.BN(`${packageValueInDollar * 8}`)))
      })
    })
    describe('II. Fail', () => {
      it('1. Cause by not a user', async () => {
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaDollar(packageValueInDollar, user98),
          'You can only buy for an exists member'
        )
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaDollar(packageValueInDollar, mainAdmin, { from: user98}),
          'Please register first'
        )
      })
      it('2. Cause by input invalid values', async () => {
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaDollar(0, mainAdmin),
          'Amount must be > 0'
        )
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaDollar(packageValueInDollar * 1000, mainAdmin),
          'Can not join with amount that greater max join package'
        )
      })
      it('3. Cause by first buy < 200', async () => {
        await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaDollar(
            packageValueInDollar / 10,
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
