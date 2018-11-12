// Allows us to use ES6 in our migrations and tests.
require('babel-register')

// Allows us to use ES6 in our migrations and tests.
require('dotenv').config()
var config = require('./config')
var secret = require('./secret-config')
const fs = require('fs')

require('babel-register')
require('babel-polyfill')

const WalletProvider = require('truffle-wallet-provider')
const EthereumWallet = require('ethereumjs-wallet')


// const ethereumKeystore = fs.readFileSync(config.ethereum.keystore).toString()
const rinkebyKeystore = fs.readFileSync(secret.rinkeby.keystore).toString()

// const ethereumWallet = EthereumWallet.fromV3(ethereumKeystore, secret.ethereum.password)
const rinkebyWallet = EthereumWallet.fromV3(rinkebyKeystore, secret.rinkeby.password)


const providers = {
  // 'ethereum': new WalletProvider(ethereumWallet, config.infura.ethereum),
  'rinkeby': new WalletProvider(rinkebyWallet, config.infura.rinkeby)
}

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '1000',
      gas: config.constants.MAX_GAS,
      gasPrice: 1,
      from: '0xe8e84ee367bc63ddb38d3d01bccef106c194dc47'  // testprc main account here
    },
    development_geth: {
      host: 'localhost',
      port: 8545,
      network_id: '8888',
      gas: config.constants.MAX_GAS,
      gasPrice: config.constants.DEFAULT_GAS_PRICE,
      from: '0xe8e84ee367bc63ddb38d3d01bccef106c194dc47'
    },
    ethereum: {
      provider: providers.ethereum,
      network_id: '1',
      gas: config.constants.MAX_GAS,
      gasPrice: config.constants.DEFAULT_GAS_PRICE
    },
    rinkeby: {
      provider: providers.rinkeby,
      gas: config.constants.MAX_GAS,
      gasPrice: config.constants.DEFAULT_GAS_PRICE,
      network_id: '4'
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    }
  }
}
