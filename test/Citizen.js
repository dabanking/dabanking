const util = require('./utils/index')

contract('Citizen', (accounts) => {
  let citizenInstance
  let reserveFundInstance
  const {
    mainAdmin,
    user1,
    user2,
    user3
  } = util.getAccounts(accounts)
  const {
    catchRevertWithReason
  } = require("./utils/exceptions.js")
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    reserveFundInstance = data.reserveFundInstance
    await reserveFundInstance.register('VALID1', mainAdmin, { from: user1 })
    await reserveFundInstance.register('VALID2', user1, { from: user2 })
    await reserveFundInstance.register('VALID3', mainAdmin, { from: user3 })
  })

  describe('I. Success', () => {
    it('1. Should return the same tree', async () => {
      let result = await citizenInstance.checkInvestorsInTheSameReferralTree(mainAdmin, user1)
      result.should.be.true;
      result = await citizenInstance.checkInvestorsInTheSameReferralTree(mainAdmin, user2)
      result.should.be.true;
      result = await citizenInstance.checkInvestorsInTheSameReferralTree(user2, mainAdmin)
      result.should.be.true;
    })

    it('2. Should return not the same tree', async () => {
      let result = await citizenInstance.checkInvestorsInTheSameReferralTree(user1, user3)
      result.should.be.false;
      result = await citizenInstance.checkInvestorsInTheSameReferralTree(user3, user1)
      result.should.be.false;
    })
  })
  describe('II. Fail', () => {
    it('1. Cause by input the same address', async () => {
      await catchRevertWithReason(
        citizenInstance.checkInvestorsInTheSameReferralTree(user1, user1),
        'They are the same'
      )
    })
  })
})
