const times = require('apr-times').default
const util = require('./utils/index')
const {
  amount,
  miningTokenRate,
  decimal,
  currentETHPrice,
  ethValueInWei,
  tokenAmount
} = util
const {
  catchRevertWithReason
} = require("./utils/exceptions.js")


contract('SellToken', (accounts) => {
  let reserveFundInstance
  let daBankingInstance
  let walletInstance
  const { mainAdmin, user1, user2, user97, user98 } = util.getAccounts(accounts)
  before( async () => {
    const data = await util.initContracts(accounts)
    reserveFundInstance = data.reserveFundInstance
    daBankingInstance = data.daBankingInstance
    walletInstance = data.walletInstance
  })
  describe('SellToken', () => {
    describe('I. Success', () => {
      it('1. My balances get increased', async() => {
        // 1. user1 register and then buy package
        // 2. user1 invite user2
        // 3. user2 buy package via ETH in 16x admin
        // 4. Make 10 daily profit so user1's C wallet get increased
        // 5. Set aiSetTokenG2 = 1000 ($1), aiSetTokenG3 = currentETHPrice
        // 6. user1 buy 1000 tokens from user1's C wallet
        // 7. Swap DAB token to get ETH

        // 1.
        await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
        await reserveFundInstance.setMaxJoinPackage(parseInt(amount * 160 * currentETHPrice))
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1,
          {
            from: user1,
            value: ethValueInWei * 10
          }
        )
        // 2.
        await reserveFundInstance.register('VALID2', user1, { from: user2 })
        // 3.
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei * 10 * 16
          }
        )
        // 4.
        await times(10, async () => {
          await walletInstance.makeDailyProfit([user1])
        })
        // 5.
        await reserveFundInstance.aiSetTokenG2(miningTokenRate)
        await reserveFundInstance.aiSetTokenG3(currentETHPrice / 1000) // so that 1eth = 5000 tokens

        // 6.
        const tokenAmountToBuy = new util.BN('1000').mul(new util.BN('' + decimal))
        const userTokenBalanceBeforeBuy = await daBankingInstance.balanceOf(user1)
        await reserveFundInstance.miningToken(
          tokenAmountToBuy,
          {
            from: user1
          }
        )
        const userTokenBalanceBefore = await daBankingInstance.balanceOf(user1)
        userTokenBalanceBefore.should.be.a.bignumber.that.equals(userTokenBalanceBeforeBuy.add(tokenAmountToBuy))
        // 7.
        const reserveFundInstanceTokenBalanceBefore = await daBankingInstance.balanceOf(reserveFundInstance.address)
        const userEtherBalanceBefore = await web3.eth.getBalance(user1)
        const tokenAmountToSell = userTokenBalanceBefore
        await daBankingInstance.approve(reserveFundInstance.address, tokenAmountToSell, { from: user1 })
        await reserveFundInstance.swapToken(
          tokenAmountToSell,
          {
            from: user1
          }
        )

        const userTokenBalanceAfter = await daBankingInstance.balanceOf(user1)
        const reserveFundInstanceTokenBalanceAfter = await daBankingInstance.balanceOf(reserveFundInstance.address)
        const userEtherBalanceAfter = await web3.eth.getBalance(user1)
        userTokenBalanceAfter.should.be.a.bignumber.that.equals(userTokenBalanceBefore.sub(tokenAmountToSell))
        reserveFundInstanceTokenBalanceAfter.should.be.a.bignumber.that.equals(reserveFundInstanceTokenBalanceBefore.add(tokenAmountToSell))
        new util.BN('' + userEtherBalanceAfter).should.be.a.bignumber.that.gt(new util.BN('' + userEtherBalanceBefore))
      })
    })
    describe('II. Fail', () => {
      it('1. Cause by not enough balance', async () => {
        await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
        await catchRevertWithReason(
          reserveFundInstance.swapToken(
            tokenAmount,
            {
              from: user97
            }
          ),
          'You have not enough balance'
        )
      })
    })
  })
})
