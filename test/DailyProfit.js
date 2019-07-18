const util = require('./utils/index')
const {
  amount,
  currentETHPrice,
  ethValueInWei,
  lockTakeProfit,
  lockBothBuyTokenAndTakeProfit,
  profitBalanceIndex,
  profitableBalanceIndex
} = util
const {
  catchRevertWithReason
} = require("./utils/exceptions.js")

contract('Wallet', (accounts) => {
  let walletInstance
  let citizenInstance
  let reserveFundInstance
  const { mainAdmin, user1, user2, user3, user4, user96, user97 } = util.getAccounts(accounts)
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    reserveFundInstance = data.reserveFundInstance
    walletInstance = data.walletInstance
  })

  describe('I. Fail', () => {
    it('1. cause by not contract admin' , async () => {
      await catchRevertWithReason(walletInstance.makeDailyProfit([mainAdmin], { from: user1 }), 'onlyContractAdmin')
    })
    it('2. cause by input invalid value' , async () => {
      await catchRevertWithReason(walletInstance.makeDailyProfit([]), 'Invalid input')
    })
    it('4. Cause by user get locked from taking profit', async () => {
      await reserveFundInstance.register('VALID96', mainAdmin, { from: user96 })
      await reserveFundInstance.lockAccounts([user96], lockTakeProfit)

      await reserveFundInstance.joinPackageViaEther(currentETHPrice, user96, { value: ethValueInWei })

      let userWallet = await walletInstance.getUserWallet(user96)
      const profitableBalanceBefore = userWallet[profitableBalanceIndex]
      const profitBalanceBefore = userWallet[profitBalanceIndex]

      await walletInstance.makeDailyProfit([user96])

      userWallet = await walletInstance.getUserWallet(user96)
      const profitableBalanceAfter = userWallet[profitableBalanceIndex]
      const profitBalanceAfter = userWallet[profitBalanceIndex]
      profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore)
      profitableBalanceBefore.should.be.a.bignumber.that.equals(profitableBalanceAfter)
    })
    it('5. Cause by user get locked from both buying package and take profit', async () => {
      await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
      await reserveFundInstance.lockAccounts([user97], lockBothBuyTokenAndTakeProfit)

      await reserveFundInstance.joinPackageViaEther(currentETHPrice, user96, { value: ethValueInWei })

      let userWallet = await walletInstance.getUserWallet(user97)
      const profitableBalanceBefore = userWallet[profitableBalanceIndex]
      const profitBalanceBefore = userWallet[profitBalanceIndex]

      await walletInstance.makeDailyProfit([user97])

      userWallet = await walletInstance.getUserWallet(user97)
      const profitableBalanceAfter = userWallet[profitableBalanceIndex]
      const profitBalanceAfter = userWallet[profitBalanceIndex]
      profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore)
      profitableBalanceBefore.should.be.a.bignumber.that.equals(profitableBalanceAfter)
    })
  })
  describe('II. Success', () => {
    it('1. get 0.5% of my profitableBalance', async () => {
      await reserveFundInstance.joinPackageViaEther(currentETHPrice, mainAdmin, { value: ethValueInWei })

      let userWallet = await walletInstance.getUserWallet(mainAdmin)
      const profitableBalanceBefore = userWallet[profitableBalanceIndex]
      const profitBalanceBefore = userWallet[profitBalanceIndex]

      await walletInstance.makeDailyProfit([mainAdmin])

      userWallet = await walletInstance.getUserWallet(mainAdmin)
      const profitableBalanceAfter = userWallet[profitableBalanceIndex]
      const profitBalanceAfter = userWallet[profitBalanceIndex]
      const todayProfit = profitableBalanceBefore * 0.5 / 100
      profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore.add(new util.BN('' + todayProfit)))
      profitableBalanceBefore.should.be.a.bignumber.that.equals(profitableBalanceAfter.add(new util.BN('' + todayProfit)))
    })
    it('2. get 0.4% of my profitableBalance when conditions are satisfied', async () => {
      await reserveFundInstance.setMaxJoinPackage(parseInt(amount * 17 * currentETHPrice))
      await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
      await reserveFundInstance.joinPackageViaEther(
        currentETHPrice,
        user1,
        {
          from: user1,
          value: ethValueInWei
        }
      )
      await reserveFundInstance.register('VALID2', user1, { from: user2 })
      await reserveFundInstance.joinPackageViaEther(
        currentETHPrice,
        user2,
        {
          from: user2,
          value: ethValueInWei * 17
        }
      )

      let totalProfitBalance = 0
      let condition
      let profits = []
      let count = 0
      let userWallet = await walletInstance.getUserWallet(user1)
      do {
        console.log('Simulating make daily profit for day: ', ++count)
        // console.log('profitableBalance', userWallet[profitableBalanceIndex].toNumber())
        await walletInstance.makeDailyProfit([user1, user2])
        userWallet = await walletInstance.getUserWallet(user1)
        totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
        profits.push(totalProfitBalance)
        condition = totalProfitBalance < amount * currentETHPrice
      } while (condition)

      userWallet = await walletInstance.getUserWallet(user1)
      const profitableBalanceBefore = userWallet[profitableBalanceIndex]
      const profitBalanceBefore = userWallet[profitBalanceIndex]

      await walletInstance.makeDailyProfit([user1, user2])

      userWallet = await walletInstance.getUserWallet(user1)
      const profitableBalanceAfter = userWallet[profitableBalanceIndex]
      const profitBalanceAfter = userWallet[profitBalanceIndex]

      const todayProfit = Math.floor(profitableBalanceBefore * 0.4 / 100)
      profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore.add(new util.BN('' + todayProfit)))
      profitableBalanceAfter.should.be.a.bignumber.that.equals(profitableBalanceBefore.sub(new util.BN('' + todayProfit)))
    })
    it('3. get 0.3% of my profitableBalance when conditions are satisfied', async () => {
      await reserveFundInstance.setMaxJoinPackage(parseInt(amount * 17 * currentETHPrice + 1))
      await reserveFundInstance.register('VALID3', mainAdmin, { from: user3 })
      await reserveFundInstance.joinPackageViaEther(
        currentETHPrice,
        user3,
        {
          from: user3,
          value: ethValueInWei
        }
      )
      await reserveFundInstance.register('VALID4', user3, { from: user4 })
      await reserveFundInstance.joinPackageViaEther(
        currentETHPrice,
        user4,
        {
          from: user4,
          value: ethValueInWei * 17
        }
      )

      let totalProfitBalance = 0
      let condition
      let profits = []
      let count = 0
      let userWallet = await walletInstance.getUserWallet(user3)
      do {
        console.log('Simulating make daily profit for day: ', ++count)
        await walletInstance.makeDailyProfit([user3, user4])
        userWallet = await walletInstance.getUserWallet(user3)
        totalProfitBalance = userWallet[profitBalanceIndex].toNumber()
        profits.push(totalProfitBalance)
        condition = totalProfitBalance < amount * currentETHPrice * 4
      } while (condition)

      userWallet = await walletInstance.getUserWallet(user3)
      const profitableBalanceBefore = userWallet[profitableBalanceIndex]
      const profitBalanceBefore = userWallet[profitBalanceIndex]

      await walletInstance.makeDailyProfit([user3, user4])

      userWallet = await walletInstance.getUserWallet(user3)
      const profitableBalanceAfter = userWallet[profitableBalanceIndex]
      const profitBalanceAfter = userWallet[profitBalanceIndex]

      const todayProfit = Math.floor(profitableBalanceBefore * 0.3 / 100)
      profitBalanceAfter.should.be.a.bignumber.that.equals(profitBalanceBefore.add(new util.BN('' + todayProfit)))
      profitableBalanceBefore.should.be.a.bignumber.that.equals(profitableBalanceAfter.add(new util.BN('' + todayProfit)))
    })
  })
})
