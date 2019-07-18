const Citizen = artifacts.require("./Citizen.sol")
const ReserveFund = artifacts.require("./ReserveFund.sol")
const DABanking = artifacts.require("./DABANKING.sol")
const Wallet = artifacts.require("./Wallet.sol")

module.exports = async function(deployer) {
  const accounts = await web3.eth.getAccounts()
  const contractAdmin = accounts[0]
  // const mainAdmin = accounts[0] // using on test
  const mainAdmin = '0xa06Cd23aA37C39095D8CFe3A0fd2654331e63123'
  // const mainAdmin = '0x27a26dc1901a087886f7cd89a3488cdd88ec1cd8'

  const citizenInstance = await deployer.deploy(Citizen, mainAdmin)
  const walletInstance = await deployer.deploy(
    Wallet,
    mainAdmin,
    citizenInstance.address
  )
  const reserveFundInstance = await deployer.deploy(
    ReserveFund,
    citizenInstance.address,
    walletInstance.address,
    mainAdmin,
    10000000000 // $10m
  )
  const daBankingInstance = await deployer.deploy(DABanking, reserveFundInstance.address)

  await reserveFundInstance.setDABankingToken(daBankingInstance.address, { from: contractAdmin })
  await walletInstance.setDABankContract(reserveFundInstance.address, { from: contractAdmin })
  await citizenInstance.setWalletContract(walletInstance.address, { from: contractAdmin })
  await citizenInstance.setDABankContract(reserveFundInstance.address, { from: contractAdmin })
}
