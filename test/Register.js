const util = require('./utils/index')
const {
  currentETHPrice,
  ethValueInWei
} = util
const { catchRevert } = require("./utils/exceptions.js")

contract('IReserveFund', (accounts) => {
  const {
    mainAdmin,
    user1,
    user2,
    user3
  } = util.getAccounts(accounts)
  let reserveFundInstance
  let citizenInstance
  const directlyInviteeIndex = 3
  const subscribersIndex = 6
  before( async () => {
    const data = await util.initContracts(accounts)
    reserveFundInstance = data.reserveFundInstance
    citizenInstance = data.citizenInstance
  })

  describe('Register', () => {
    const validUserName = 'ABCD123'
    describe('I. Success', async () => {
      it('1. Main admin should have no inviter', async () => {
        const inviter = await citizenInstance.getInviter(mainAdmin)
        assert.equal(inviter, 0x0)
      })
      it('2. Should fire Registered event', async () => {
        const result = await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
        util.listenEvent(result, 'Registered')
      })
      it('3. Should have correct ref info', async () => {
        const adminInfoBefore = await reserveFundInstance.showMe({ from: mainAdmin })
        await reserveFundInstance.register(validUserName, mainAdmin, { from: user2 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user1,
          {
            from: user1,
            value: ethValueInWei
          }
        )
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user2,
          {
            from: user2,
            value: ethValueInWei
          }
        )
        const adminInfoAfter = await reserveFundInstance.showMe({ from: mainAdmin })
        adminInfoAfter[directlyInviteeIndex].length.should.equals(adminInfoBefore[directlyInviteeIndex].length + 1)
        adminInfoAfter[subscribersIndex].should.be.a.bignumber.that.equals(adminInfoBefore[subscribersIndex].add(new util.BN('1')))
        assert.equal(adminInfoAfter[directlyInviteeIndex].includes(user1), true)

        const inviter = await citizenInstance.getInviter(user1)
        assert.equal(inviter, mainAdmin)
      })
      it('4. Should have correct ref info on multiple levels', async () => {
        const investorCount = await citizenInstance.getInvestorCount()
        await reserveFundInstance.register("VALID3", user2, { from: user3 })
        await reserveFundInstance.joinPackageViaEther(
          currentETHPrice,
          user3,
          {
            from: user3,
            value: ethValueInWei
          }
        )
        const newInvestorCount = await citizenInstance.getInvestorCount()
        newInvestorCount.should.be.a.bignumber.that.equals(investorCount.add(new util.BN('1')))

        const user2Info = await reserveFundInstance.showMe({ from: user2 })

        assert.equal(user2Info[directlyInviteeIndex].includes(user3), true)

        const inviter = await citizenInstance.getInviter(user3)
        assert.equal(inviter, user2)
      })
    })

    describe('II. Fail', () => {
      it('1. Cause by userName invalid', async () => {
        await catchRevert(reserveFundInstance.register('123', mainAdmin))
        await catchRevert(reserveFundInstance.register('123456789123456789123456789', mainAdmin))
        await catchRevert(reserveFundInstance.register('Abcd', mainAdmin))
        await catchRevert(reserveFundInstance.register('0ABCD', mainAdmin))
        await catchRevert(reserveFundInstance.register('AB CD', mainAdmin))
      })
      it('2. Cause by using exists userName', async () => {
        await catchRevert(reserveFundInstance.register(validUserName, mainAdmin))
      })
      it('3. Cause by using exists user', async () => {
        await catchRevert(reserveFundInstance.register('VALID3', mainAdmin))
      })
      it('4. Cause by self invite', async () => {
        await catchRevert(reserveFundInstance.register('SELFINVITE', user3, { from: user3 }))
      })
    })
  })
})
