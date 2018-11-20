let config = {
  rinkeby: {
    keystore: process.env.RINKEBY_KEYSTORE,
    password: process.env.RINKEBY_PASSWORD
  },
  ropsten: {
    keystore: process.env.ROPSTEN_KEYSTORE,
    password: process.env.ROPSTEN_PASSWORD
  },
  ethereum: {
    keystore: process.env.MAINNET_KEYSTORE,
    password: process.env.MAINNET_PASSWORD
  }
}

module.exports = config