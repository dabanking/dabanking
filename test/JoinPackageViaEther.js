
const util = require('./utils/index')
const {
  amount,
  currentETHPrice,
  ethValueInWei,
  depositedIndex,
  profitableBalanceIndex,
  profitSourceBalanceIndex,
  networkDepositedViaETHIndex
} = util
const { catchRevertWithReason } = require("./utils/exceptions.js")

contract('IReserveFund', (accounts) => {
  const {
    mainAdmin,
    user1,
    user2,
    user3,
    user97,
    user98
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

  describe('BuyPackageViaEther', () => {
    describe('I. Success', async () => {
      it('1. My balances are increase', async() => {
        const packageValue = currentETHPrice * amount

        let userWallet = await walletInstance.getUserWallet(mainAdmin, { from: mainAdmin })

        const depositedBefore = userWallet[depositedIndex]
        const profitableBalanceBefore = userWallet[profitableBalanceIndex]
        const profitSourceBalanceBefore = userWallet[profitSourceBalanceIndex]

        // first buy: x2 profitableBalance
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          mainAdmin,
          {
            value: ethValueInWei
          }
        )

        userWallet = await walletInstance.getUserWallet(mainAdmin, { from: mainAdmin })

        const depositedAfter = userWallet[depositedIndex]
        const profitableBalanceAfter = userWallet[profitableBalanceIndex]
        const profitSourceBalanceAfter = userWallet[profitSourceBalanceIndex]

        depositedAfter.length.should.equal(depositedBefore.length + 1)
        profitableBalanceAfter.should.be.a.bignumber.that.equals(profitableBalanceBefore.add(new util.BN(`${packageValue * 2}`)))
        profitSourceBalanceAfter.should.be.a.bignumber.that.equals(profitSourceBalanceBefore.add(new util.BN(`${packageValue * 8}`)))

        // second buy: x1 profitableBalance
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          mainAdmin,
          {
            value: ethValueInWei
          }
        )

        userWallet = await walletInstance.getUserWallet(mainAdmin, { from: mainAdmin })

        const deposited3 = userWallet[depositedIndex]
        const profitableBalance3 = userWallet[profitableBalanceIndex]
        const profitSourceBalance3 = userWallet[profitSourceBalanceIndex]

        assert.equal(deposited3.length, depositedAfter.length + 1)
        profitableBalance3.should.be.a.bignumber.that.equals(profitableBalanceAfter.add(new util.BN('' + packageValue)))
        profitSourceBalance3.should.be.a.bignumber.that.equals(profitSourceBalanceAfter.add(new util.BN(`${packageValue * 8}`)))
      })
      it('2. Should emit PackageJoinedViaEther event on successful', async() => {
        const amount = 0.1
        const response = await reserveFundInstance.joinPackageViaEther(currentETHPrice, mainAdmin, { value: web3.utils.toWei('' + amount, 'ether') })
        util.listenEvent(response, 'PackageJoinedViaEther')
      })
      it('3. Sub Admin should receive 10% of Ether that user use to buy', async () => {
        await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
        let adminBalanceBefore = await web3.eth.getBalance(mainAdmin)
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1 ,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        const adminBalanceAfter = new util.BN(await web3.eth.getBalance(mainAdmin))
        adminBalanceAfter.should.be.a.bignumber.that.gt(new util.BN(adminBalanceBefore))
      })
      it('4. My inviter should get increased the f1Deposited, networkDeposited & networkDepositedViaETH value', async () => {
        // This test is depend on test case No. 3
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1 ,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.register('VALID2', user1, { from: user2 })
        const user1F1DepositedBefore = await citizenInstance.getF1Deposited(user1)
        const user1NetworkDepositedBefore = await citizenInstance.getNetworkDeposited(user1)
        let depositInfo = await citizenInstance.getDepositInfo(user1)
        const networkDepositedViaETHBefore = depositInfo[networkDepositedViaETHIndex]
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei
          }
        )
        const user1F1DepositedAfter = await citizenInstance.getF1Deposited(user1)
        const user1NetworkDepositedAfter = await citizenInstance.getNetworkDeposited(user1)
        depositInfo = await citizenInstance.getDepositInfo(user1)
        const networkDepositedViaETHAfter = depositInfo[networkDepositedViaETHIndex]
        user1F1DepositedAfter.should.be.bignumber.that.equals(user1F1DepositedBefore.add(new util.BN('' + (amount * currentETHPrice))))
        user1NetworkDepositedAfter.should.be.bignumber.that.equals(user1NetworkDepositedBefore.add(new util.BN('' + (amount * currentETHPrice))))
        networkDepositedViaETHAfter.should.be.bignumber.that.equals(networkDepositedViaETHBefore.add(new util.BN('' + ethValueInWei)))
      })
      it('5. My inviters should get increased the networkDeposited value', async () => {
        // This test is depends on No. 4
        await reserveFundInstance.register('VALID3', user2, { from: user3 })
        const user1NetworkDepositedBefore = await citizenInstance.getNetworkDeposited(user1)
        const user2NetworkDepositedBefore = await citizenInstance.getNetworkDeposited(user2)
        let user1DepositInfo = await citizenInstance.getDepositInfo(user1)
        const user1NetworkDepositedViaETHBefore = user1DepositInfo[networkDepositedViaETHIndex]
        let user2DepositInfo = await citizenInstance.getDepositInfo(user2)
        const user2NetworkDepositedViaETHBefore = user2DepositInfo[networkDepositedViaETHIndex]

        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user3,
          {
            from: user3,
            value: ethValueInWei
          }
        )
        const user1NetworkDepositedAfter = await citizenInstance.getNetworkDeposited(user1)
        user1NetworkDepositedAfter.should.be.bignumber.that.equals(user1NetworkDepositedBefore.add(new util.BN('' + (amount * currentETHPrice))))
        const user2NetworkDepositedAfter = await citizenInstance.getNetworkDeposited(user2)
        user2NetworkDepositedAfter.should.be.bignumber.that.equals(user2NetworkDepositedBefore.add(new util.BN('' + (amount * currentETHPrice))))
        user1DepositInfo = await citizenInstance.getDepositInfo(user1)
        const user1NetworkDepositedViaETHAfter = user1DepositInfo[networkDepositedViaETHIndex]
        user1NetworkDepositedViaETHAfter.should.be.bignumber.that.equals(user1NetworkDepositedViaETHBefore.add(new util.BN('' + ethValueInWei)))
        user2DepositInfo = await citizenInstance.getDepositInfo(user2)
        const user2NetworkDepositedViaETHAfter = user2DepositInfo[networkDepositedViaETHIndex]
        user2NetworkDepositedViaETHAfter.should.be.bignumber.that.equals(user2NetworkDepositedViaETHBefore.add(new util.BN('' + ethValueInWei)))
      })
    })

    describe('II. Fail', async () => {
      it('1. Cause by feature is disabled', async () => {
        await reserveFundInstance.setEnableJoinPackageViaEther(false, { from: mainAdmin })
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(currentETHPrice, mainAdmin),
          'Can not buy via Ether now'
        )
      })
      it('2. Cause by not a user', async () => {
        await reserveFundInstance.setEnableJoinPackageViaEther(true, { from: mainAdmin })
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(currentETHPrice, user98),
          'You can only buy for an exists member'
        )
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(currentETHPrice, mainAdmin, { from: user98}),
          'Please register first'
        )
      })
      it('3. Cause by input invalid values', async () => {
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(currentETHPrice, mainAdmin),
          'Amount must be > 0'
        )
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(0, mainAdmin, { value: web3.utils.toWei('0.5', 'ether') }),
          'Rate must be > 0'
        )
      })
      it('4. Ether would be refunded on failure', async () => {
        let balance = await web3.eth.getBalance(mainAdmin)
        balance = await web3.utils.fromWei(balance)
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(0, mainAdmin, { value: web3.utils.toWei('' + amount, 'ether') }),
          'Rate must be > 0'
        )
        let newBalance = await web3.eth.getBalance(mainAdmin)
        newBalance = await web3.utils.fromWei(newBalance)
        parseInt(newBalance).should.be.above(parseInt(balance) - amount)
      })
      it('5. Cause by trying to buy > maxBuy', async () => {
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(currentETHPrice, mainAdmin, { value: web3.utils.toWei('2', 'ether') }),
          'Can not join with amount that greater max join package'
        )
      })
      it('6. Cause by first buy < 200', async () => {
        await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(
            currentETHPrice,
            user97,
            {
              from: user97,
              value: web3.utils.toWei('0.001', 'ether')
            }
          ),
          'Minimum for first join is $200'
        )
      })
      it('7. Cause by current amount is < last buy amount', async () => {
        // This test is depend on test case No. 6
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user97,
          {
            from: user97,
            value: web3.utils.toWei('' + amount, 'ether')
          }
        ),
        await catchRevertWithReason(
          reserveFundInstance.joinPackageViaEther(
            currentETHPrice,
            user97,
            {
              from: user97,
              value: web3.utils.toWei('0.001', 'ether')
            }
          ),
          'Can not join with amount that lower than your last join'
        )
      })
    })
  })
})
