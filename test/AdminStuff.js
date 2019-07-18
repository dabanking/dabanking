const util = require('./utils/index')
const {
  catchRevert,
  catchRevertWithReason
} = require("./utils/exceptions.js")

contract('IReserveFund', (accounts) => {
  let reserveFundInstance
  let citizenInstance
  const { user1, user2, mainAdmin, contractAdmin } = util.getAccounts(accounts)
  const rate = 10
  const duplicateRate = 11
  before( async () => {
    const data = await util.initContracts(accounts)
    citizenInstance = data.citizenInstance
    reserveFundInstance = data.reserveFundInstance
  })

  describe('I. Admin aiSetTokenG2', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.aiSetTokenG2(rate, { from: user1 }))
    })
    it('2. success' , async () => {
      await reserveFundInstance.aiSetTokenG2(rate)
      const newRate = await reserveFundInstance.aiTokenG2()
      newRate.should.be.a.bignumber.that.equals('' + rate)
    })
    it('3. fail cause by input current value' , async () => {
      await reserveFundInstance.aiSetTokenG2(duplicateRate)
      await catchRevert(reserveFundInstance.aiSetTokenG2(duplicateRate))
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.aiSetTokenG2(0))
    })
  })

  describe('II. Admin aiSetTokenG3', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.aiSetTokenG3(rate, { from: user1 }))
    })
    it('2. success' , async () => {
      await reserveFundInstance.aiSetTokenG3(rate)
      const newRate = await reserveFundInstance.getAITokenG3()
      newRate.should.be.a.bignumber.that.equals('' + rate)
    })
    it('3. fail cause by input current value' , async () => {
      await reserveFundInstance.aiSetTokenG3(duplicateRate)
      await catchRevert(reserveFundInstance.aiSetTokenG3(duplicateRate))
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.aiSetTokenG3(0))
    })
  })

  describe('III. Admin setMiningDifficulty', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.setMiningDifficulty(rate, { from: user1 }))
    })
    it('2. success' , async () => {
      await reserveFundInstance.setMiningDifficulty(rate)
      const newRate = await reserveFundInstance.getMiningDifficulty()
      newRate.should.be.a.bignumber.that.equals('' + rate)
    })
    it('3. fail cause by input current value' , async () => {
      await reserveFundInstance.setMiningDifficulty(duplicateRate)
      await catchRevert(reserveFundInstance.setMiningDifficulty(duplicateRate))
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.setMiningDifficulty(0))
    })
  })

  describe('IV. Admin setMinJoinPackage', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.setMinJoinPackage(rate, { from: user1 }))
    })
    it('2. success' , async () => {
      await reserveFundInstance.setMinJoinPackage(rate)
      const newRate = await reserveFundInstance.minJoinPackage()
      newRate.should.be.a.bignumber.that.equals('' + rate)
    })
    it('3. fail cause by input current value' , async () => {
      await reserveFundInstance.setMinJoinPackage(duplicateRate)
      await catchRevert(reserveFundInstance.setMinJoinPackage(duplicateRate))
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.setMinJoinPackage(0))
    })
    it('5. fail cause by input value > max join' , async () => {
      const maxJoin = await reserveFundInstance.maxJoinPackage()
      await catchRevertWithReason(reserveFundInstance.setMinJoinPackage(maxJoin + 1), 'Must be < maxJoinPackage')
    })
  })

  describe('V. Admin setMaxJoinPackage', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.setMaxJoinPackage(rate, { from: user1 }))
    })
    it('2. success' , async () => {
      const minJoinPackage = await reserveFundInstance.minJoinPackage()
      const maxJoinPackage = minJoinPackage + 1
      await reserveFundInstance.setMaxJoinPackage(maxJoinPackage)
      const newRate = await reserveFundInstance.maxJoinPackage()
      newRate.should.be.a.bignumber.that.equals('' + maxJoinPackage)
    })
    it('3. fail cause by input current value' , async () => {
      const maxJoinPackage = await reserveFundInstance.maxJoinPackage()
      await catchRevertWithReason(reserveFundInstance.setMaxJoinPackage(maxJoinPackage), 'Must be new value')
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.setMaxJoinPackage(0))
    })
  })

  describe('VI. Admin enableBuyPackageViaEther', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.setEnableJoinPackageViaEther(true, { from: user1 }))
    })
    it('2. success' , async () => {
      await reserveFundInstance.setEnableJoinPackageViaEther(false)
      const enabled = await reserveFundInstance.enableJoinPackageViaEther()
      enabled.should.be.false;
    })
    it('3. fail cause by input current value' , async () => {
      await reserveFundInstance.setEnableJoinPackageViaEther(true)
      await catchRevert(reserveFundInstance.setEnableJoinPackageViaEther(true))
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.setEnableJoinPackageViaEther(123))
    })
  })

  describe('VII. Lock accounts', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.lockAccounts([user2], 1, { from: user1 }))
    })
    it('2. fail cause by self-locking' , async () => {
      await catchRevertWithReason(
        reserveFundInstance.lockAccounts([mainAdmin], 1, { from: mainAdmin }),
        'You cannot lock yourself'
      )
    })
    it('3. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.lockAccounts([], 1))
      await catchRevert(reserveFundInstance.lockAccounts([user2], 5))
    })
    it('4. success' , async () => {
      const lockStatus = 1
      await reserveFundInstance.lockAccounts([user2], lockStatus)
      const updatedStatus = await reserveFundInstance.lockedAccounts(user2)
      updatedStatus.toNumber().should.be.equals(lockStatus)
    })
  })

  describe('VIII. Admin setTransferDifficulty', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevert(reserveFundInstance.setTransferDifficulty(rate, { from: user1 }))
    })
    it('2. success' , async () => {
      await reserveFundInstance.setTransferDifficulty(rate)
      const newRate = await reserveFundInstance.getTransferDifficulty()
      newRate.should.be.a.bignumber.that.equals('' + rate)
    })
    it('3. fail cause by input current value' , async () => {
      await reserveFundInstance.setTransferDifficulty(duplicateRate)
      await catchRevert(reserveFundInstance.setTransferDifficulty(duplicateRate))
    })
    it('4. fail cause by input invalid value' , async () => {
      await catchRevert(reserveFundInstance.setTransferDifficulty(0))
    })
  })

  describe('IX. Admin updateContractAdmin', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevertWithReason(
        reserveFundInstance.updateContractAdmin(
          user2,
          {
            from: user1
          }
        )
      , 'onlyAdmin')
    })
    it('2. success' , async () => {
      let isContractAdmin = await reserveFundInstance.isContractAdmin()
      isContractAdmin.should.be.true
      await reserveFundInstance.updateContractAdmin(
        user1
      )
      isContractAdmin = await reserveFundInstance.isContractAdmin()
      isContractAdmin.should.be.false
      isContractAdmin = await reserveFundInstance.isContractAdmin({
        from: user1
      })
      isContractAdmin.should.be.true
      await reserveFundInstance.updateContractAdmin(
        contractAdmin,
        {
          from: user1
        }
      )
    })
  })

  describe('X. Admin updateETHPrice', () => {
    it('1. fail cause by not admin' , async () => {
      await catchRevertWithReason(
        reserveFundInstance.updateETHPrice(
          1,
          {
            from: user1
          }
        )
      , 'onlyAdmin')
    })
    it('2. success' , async () => {
      const price = 123
      await reserveFundInstance.updateETHPrice(price)
      const updatedKey = await reserveFundInstance.currentETHPrice()
      updatedKey.toNumber().should.equal(price)
    })
  })
})
