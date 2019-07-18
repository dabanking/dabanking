const util = require('./utils/index')
const {
  amount,
  currentETHPrice,
  ethValueInWei,
  profitableBalanceIndex,
  profitSourceBalanceIndex
} = util

contract('IReserveFund', (accounts) => {
  const {
    mainAdmin, user1, user2, user3, user10,
    user11, user12, user13, user14, user15, user16, user17, user18, user19, user20,
    user21, user22, user23, user24, user25, user26, user27, user28, user29
  } = util.getAccounts(accounts)
  let reserveFundInstance
  let citizenInstance
  let walletInstance
  before( async () => {
    const data = await util.initContracts(accounts)
    reserveFundInstance = data.reserveFundInstance
    citizenInstance = data.citizenInstance
    walletInstance = data.walletInstance
  })

  describe('ReferralReward', () => {
    describe('I. Success', async () => {
      it('1. My inviter should not get 50% of my package value when he have no money on profitSourceBalance', async () => {
        await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        const userWallet = await walletInstance.getUserWallet(mainAdmin)

        const profitableBalance2 = userWallet[profitableBalanceIndex]
        const profitSourceBalance2 = userWallet[profitSourceBalanceIndex]
        profitableBalance2.should.be.bignumber.that.equals(new util.BN('0'))
        profitSourceBalance2.should.be.bignumber.that.equals(new util.BN('0'))
      })
      it('2. My inviter should get 50% of my package value', async () => {
        // This test is depend on test case No. 1
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          mainAdmin,
          {
            from: mainAdmin,
            value: ethValueInWei
          }
        )
        let userWallet = await walletInstance.getUserWallet(mainAdmin)

        const profitableBalance = userWallet[profitableBalanceIndex]
        const profitSourceBalance = userWallet[profitSourceBalanceIndex]

        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        userWallet = await walletInstance.getUserWallet(mainAdmin)

        const profitableBalance2 = userWallet[profitableBalanceIndex]
        const profitSourceBalance2 = userWallet[profitSourceBalanceIndex]
        profitableBalance2.should.be.bignumber.that.equals(profitableBalance.add(new util.BN('' + (amount * currentETHPrice / 2))))
        profitSourceBalance2.should.be.bignumber.that.equals(profitSourceBalance.sub(new util.BN('' + (amount * currentETHPrice / 2))))
      })
      it('3. Should get Level2 reward when conditions are satisfied', async () => {
        // This test is depend on test case No. 1 & 2
        await reserveFundInstance.register('VALID2', mainAdmin, { from: user2 })
        await reserveFundInstance.register('VALID3', user2, { from: user3 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei * 3
          }
        )
        let userWallet = await walletInstance.getUserWallet(mainAdmin)

        const profitableBalance = userWallet[profitableBalanceIndex]
        const profitSourceBalance = userWallet[profitSourceBalanceIndex]
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user3,
          {
            from: user3,
            value: ethValueInWei
          }
        )
        userWallet = await walletInstance.getUserWallet(mainAdmin)

        const profitableBalance2 = userWallet[profitableBalanceIndex]
        const profitSourceBalance2 = userWallet[profitSourceBalanceIndex]
        profitableBalance2.should.be.bignumber.that.equals(profitableBalance.add(new util.BN('' + (amount * currentETHPrice / 10))))
        profitSourceBalance2.should.be.bignumber.that.equals(profitSourceBalance.sub(new util.BN('' + (amount * currentETHPrice / 10))))
      })
      it('4. Should get Level10 reward when conditions are satisfied', async () => {
        // 1. user10 invite user11-20
        // 2. user20 make 9 level in deep (user21-29)
        // 3. user10 buy first package, then user11-user28 buy $200 each
        // 4. so when user29 buy package, we'll test that user10 get 10% of level10

        // 1.
        await reserveFundInstance.register('VALID10', mainAdmin, { from: user10 })

        // 10 F1
        await reserveFundInstance.register('VALID11', user10, { from: user11 })
        await reserveFundInstance.register('VALID12', user10, { from: user12 })
        await reserveFundInstance.register('VALID13', user10, { from: user13 })
        await reserveFundInstance.register('VALID14', user10, { from: user14 })
        await reserveFundInstance.register('VALID15', user10, { from: user15 })
        await reserveFundInstance.register('VALID16', user10, { from: user16 })
        await reserveFundInstance.register('VALID17', user10, { from: user17 })
        await reserveFundInstance.register('VALID18', user10, { from: user18 })
        await reserveFundInstance.register('VALID19', user10, { from: user19 })
        await reserveFundInstance.register('VALID20', user10, { from: user20 })

        // 2. F2-F10
        await reserveFundInstance.register('VALID21', user20, { from: user21 })
        await reserveFundInstance.register('VALID22', user21, { from: user22 })
        await reserveFundInstance.register('VALID23', user22, { from: user23 })
        await reserveFundInstance.register('VALID24', user23, { from: user24 })
        await reserveFundInstance.register('VALID25', user24, { from: user25 })
        await reserveFundInstance.register('VALID26', user25, { from: user26 })
        await reserveFundInstance.register('VALID27', user26, { from: user27 })
        await reserveFundInstance.register('VALID28', user27, { from: user28 })
        await reserveFundInstance.register('VALID29', user28, { from: user29 })

        // 3.
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user10,
          {
            from: user10,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user11,
          {
            from: user11,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user12,
          {
            from: user12,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user13,
          {
            from: user13,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user14,
          {
            from: user14,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user15,
          {
            from: user15,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user16,
          {
            from: user16,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user17,
          {
            from: user17,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user18,
          {
            from: user18,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user19,
          {
            from: user19,
            value: ethValueInWei
          }
        )
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
          user21,
          {
            from: user21,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user22,
          {
            from: user22,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user23,
          {
            from: user23,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user24,
          {
            from: user24,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user25,
          {
            from: user25,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user26,
          {
            from: user26,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user27,
          {
            from: user27,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user28,
          {
            from: user28,
            value: ethValueInWei
          }
        )
        let user10Wallet = await walletInstance.getUserWallet(user10)

        const profitableBalance = user10Wallet[profitableBalanceIndex]
        const profitSourceBalance = user10Wallet[profitSourceBalanceIndex]
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user29,
          {
            from: user29,
            value: ethValueInWei
          }
        )
        user10Wallet = await walletInstance.getUserWallet(user10)

        const profitableBalance2 = user10Wallet[profitableBalanceIndex]
        const profitSourceBalance2 = user10Wallet[profitSourceBalanceIndex]
        profitableBalance2.should.be.bignumber.that.equals(profitableBalance.add(new util.BN('' + (amount * currentETHPrice / 10))))
        profitSourceBalance2.should.be.bignumber.that.equals(profitSourceBalance.sub(new util.BN('' + (amount * currentETHPrice / 10))))
      })
    })
  })
})
