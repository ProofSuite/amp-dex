let config = {
  infura: {
    ethereum: 'https://mainnet.infura.io',
    ropsten: 'https://ropsten.infura.io',
    rinkeby: 'https://rinkeby.infura.io',
    kovan: 'https://kovan.infura.io'
  },
  constants: {
    DEFAULT_GAS: 4.5 * 10 ** 6,
    MAX_GAS: 6.0 * 10 ** 6,
    DEFAULT_LOW_GAS_PRICE: 0.1 * 10 ** 9,
    DEFAULT_GAS_PRICE: 15 * 10 ** 9,
    DEFAULT_HIGH_GAS_PRICE: 9 * 10 ** 9,
    TOKENS_ALLOCATED_TO_PROOF: 1181031 * (10 ** 18),
    DECIMALS_POINTS: 10 ** 18,
    TOKEN_UNITS: 10 ** 18,
    ETHER: 10 ** 18
  },
  ipfs: {
    PRODUCTION: 'QmUM5eT3vY9NfeJ9JBg8xcrom3jEZ3J86wRtNPsFBJ6QFo',
    TESTING_SUCCESS: 'QmVuyH2JtbTguZuC5HsefNBbu8SNSUdq6mrHHDhGeLob3V',
    TESTING_FAIL: 'QmUGo9mjcdc232p4YUgGf5mdZ5aAvVrVpp8AXiN4AuvBZd'
  },
  accounts: {
    development: [],
    rinkeby: [
      '0xcc5697310277bcc3be506f53ed8aafc9d17a2c18',
      '0x3b89e78363d872c80c78c254bf1bb9ff9e586571',
      '0xf2934427c36ba897f9be6ed554ed2dbce3da1c68',
      '0xfa4f991caa4f37f7bce2e285e155da8c929658ef',
      '0xb21a999ba39015df00ee33e55caf08af86b46bfa',
      '0xdc64ae432d848cf38a89c6f30a04884e22e83c74',
      '0xbf8e9e3f9dbb85554679ce8147077b0496358f53',
      '0xc8b74b6b883a96e3defd62934ec3a1e44f149860',
      '0x53ee745b3d30d692dc016450fef68a898c16fa44',
      '0xe0a1240b358dfa6c167edea09c763ae9f3b51ea0',
    ],
    ropsten: [],
    ethereum: []
  }
}

module.exports = config