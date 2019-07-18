const util = require('./utils/index')

contract('IReserveFund', (accounts) => {
  let citizenInstance
  const { mainAdmin } = util.getAccounts(accounts)
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
  })

  it('Should have admin account', async () => {
    const result = await citizenInstance.isCitizen(mainAdmin)
    result.should.be.true;
  })
})
