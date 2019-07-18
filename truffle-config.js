require('dotenv').config()
const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(process.env.PRIVATE_KEY, `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`)
      },
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 99000000000,
      network_id: 3
    },
    mainnet: {
      provider: function () {
        return new HDWalletProvider(process.env.MAINNET_PRIVATE_KEY, `https://mainnet.infura.io/v3/${process.env.MAINNET_INFURA_API_KEY}`)
      },
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 99000000000,
      network_id: 1
    }
  },

  compilers: {
    solc: {
      version: "0.4.25",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  mocha: {
    // reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 20
    }
  }
}
