const util = require('./utils/index')
const {
  currentETHPrice,
  ethValueInWei,
  profitBalanceIndex
} = util
const {
  catchRevertWithReason
} = require("./utils/exceptions.js")


contract('TransferProfitWallet', (accounts) => {
  let citizenInstance
  let reserveFundInstance
  let walletInstance
  const {
    mainAdmin,
    user1,
    user2,
    user3,
    user4,
    user95,
    user96,
    user97,
    user98,
  } = util.getAccounts(accounts)
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    reserveFundInstance = data.reserveFundInstance
    walletInstance = data.walletInstance
  })
  describe('BuyPackageViaDollar', () => {
    describe('I. Success', () => {
      it('1. Transferred to my invitee', async() => {
        // 1. user1 register and then buy package
        // 2. user1 invite user2
        // 3. user2 buy package via ETH
        // 4. Make daily profit for user1
        // 5. user1 transfer to user2

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
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei
          }
        )
        // 4.
        await walletInstance.makeDailyProfit([user1, user2])

        // 5.
        let userWallet = await walletInstance.getUserWallet(user1)
        let user2Wallet = await walletInstance.getUserWallet(user2)
        const user1ProfitBalanceBefore = userWallet[profitBalanceIndex]
        const user2ProfitBalanceBefore = user2Wallet[profitBalanceIndex]
        const response = await walletInstance.transferProfitWallet(
          user1ProfitBalanceBefore,
          user2,
          {
            from: user1
          }
        )
        util.listenEvent(response, 'ProfitBalanceTransferred')
        userWallet = await walletInstance.getUserWallet(user1)
        user2Wallet = await walletInstance.getUserWallet(user2)
        const profitBalanceAfter = userWallet[profitBalanceIndex]
        const user2ProfitBalanceAfter = user2Wallet[profitBalanceIndex]
        assert.equal(profitBalanceAfter, 0)
        user2ProfitBalanceAfter.should.be.a.bignumber.that.equals(user2ProfitBalanceBefore.add(user1ProfitBalanceBefore))
      })
      it('1. Transferred to my inviter', async() => {
        // 1. user3 register and then buy package
        // 2. user3 invite user4
        // 3. user4 buy package via ETH
        // 4. Make daily profit
        // 5. user4 transfer to user3

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
            value: ethValueInWei
          }
        )
        // 4.
        await walletInstance.makeDailyProfit([user4])

        // 5.
        let userWallet = await walletInstance.getUserWallet(user3)
        let user4Wallet = await walletInstance.getUserWallet(user4)
        const user3ProfitBalanceBefore = userWallet[profitBalanceIndex]
        const user4ProfitBalanceBefore = user4Wallet[profitBalanceIndex]
        await walletInstance.transferProfitWallet(
          user4ProfitBalanceBefore,
          user3,
          {
            from: user4
          }
        )
        userWallet = await walletInstance.getUserWallet(user3)
        user4Wallet = await walletInstance.getUserWallet(user4)
        const user3ProfitBalanceAfter = userWallet[profitBalanceIndex]
        const user4ProfitBalanceAfter = user4Wallet[profitBalanceIndex]
        assert.equal(user4ProfitBalanceAfter, 0)
        user3ProfitBalanceAfter.should.be.a.bignumber.that.equals(user3ProfitBalanceBefore.add(user4ProfitBalanceBefore))
      })
    })
    describe('II. Fail', () => {
      it('1. Cause by not a user', async () => {
        const minTransfer = await reserveFundInstance.getTransferDifficulty()
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          mainAdmin,
          {
            value: ethValueInWei
          }
        )
        await walletInstance.makeDailyProfit([mainAdmin])
        await catchRevertWithReason(
          walletInstance.transferProfitWallet(minTransfer, user98),
          'You can only transfer to an exists member'
        )
        await catchRevertWithReason(
          walletInstance.transferProfitWallet(minTransfer, mainAdmin, { from: user98}),
          'Please register first'
        )
      })
      it('2. Cause by input invalid values', async () => {
        const minTransfer = await reserveFundInstance.getTransferDifficulty()
        await catchRevertWithReason(
          walletInstance.transferProfitWallet(minTransfer.toNumber() - 1, mainAdmin),
          'Amount must be >= minimumTransferProfitBalance'
        )
      })
      it('3. Cause by not enough balance', async () => {
        await reserveFundInstance.register('VALID97', mainAdmin, { from: user97 })
        await catchRevertWithReason(
          walletInstance.transferProfitWallet(
            1000,
            mainAdmin,
            {
              from: user97
            }
          ),
          'You have not enough balance'
        )
      })
      it('4. Cause by user is not in referral tree', async () => {
        const minTransfer = await reserveFundInstance.getTransferDifficulty()
        await reserveFundInstance.register('VALID96', mainAdmin, { from: user96 })
        await reserveFundInstance.register('VALID98', mainAdmin, { from: user98 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user96,
          {
            from: user96,
            value: ethValueInWei
          }
        )
        await walletInstance.makeDailyProfit([user96])
        await catchRevertWithReason(
          walletInstance.transferProfitWallet(
            minTransfer,
            user98,
            {
              from: user96
            }
          ),
          'This user isn\'t in your referral tree'
        )
      })
      it('5. Cause by self transfer', async () => {
        const minTransfer = await reserveFundInstance.getTransferDifficulty()
        await reserveFundInstance.register('VALID95', mainAdmin, { from: user95 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user95,
          {
            from: user95,
            value: ethValueInWei
          }
        )

        await walletInstance.makeDailyProfit([user95])
        await catchRevertWithReason(
          walletInstance.transferProfitWallet(
            minTransfer,
            user95,
            {
              from: user95
            }
          ),
          'They are the same'
        )
      })
    })
  })
})
