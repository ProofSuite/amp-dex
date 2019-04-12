// Allows us to use ES6 in our migrations and tests.
require('babel-register')

// Allows us to use ES6 in our migrations and tests.
require('dotenv').config()
const fs = require('fs')

require('babel-register')
require('babel-polyfill')

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 22000,
      network_id: '*',
      gasPrice: 0,
      gas: 4500000
    },
    nodefour: {
      host: '127.0.0.1',
      port: 22003,
      network_id: '*',
      gasPrice: 0,
      gas: 4500000
    },
    nodeseven: {
      host: '127.0.0.1',
      port: 22006,
      network_id: '*',
      gasPrice: 0,
      gas: 4500000
    }
  },

  compilers: {
    solc: {
      version: '0.4.24'
    }
  }
}
