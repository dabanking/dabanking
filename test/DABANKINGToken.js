const util = require('./utils/index')

contract('DABANKING', (accounts) => {
  let reserveFundInstance
  let daBankingInstance
  let totalSupply
  before( async () => {
    const data = await util.initContracts(accounts)
    reserveFundInstance = data.reserveFundInstance
    daBankingInstance = data.daBankingInstance
  })
  it('1. Have correct name' , async () => {
    const name = await daBankingInstance.name()
    name.should.equal('DABANKING')
  })
  it('2. Have correct symbol' , async () => {
    const symbol = await daBankingInstance.symbol()
    symbol.should.equal('DAB')
  })
  it('3. Have correct decimals' , async () => {
    const decimals = await daBankingInstance.decimals()
    decimals.should.be.a.bignumber.that.equals('18')
  })
  it('4. Have correct totalSupply' , async () => {
    totalSupply = await daBankingInstance.totalSupply()
    totalSupply.should.be.a.bignumber.that.equals('200000000000000000000000000')
  })
  it('5. Should transfer totalSupply to dabank at deployment', async () => {
    const dabankBalance = await daBankingInstance.balanceOf(reserveFundInstance.address)
    dabankBalance.should.be.a.bignumber.that.equals(totalSupply)
  })
})
