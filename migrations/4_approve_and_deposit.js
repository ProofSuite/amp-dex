
const Exchange = artifacts.require('./Exchange.sol')
const Token1 = artifacts.require('./contracts/tokens/Token1.sol')
const Token2 = artifacts.require('./contracts/tokens/Token2.sol')
const Token3 = artifacts.require('./contracts/tokens/Token3.sol')

const accounts = web3.eth.accounts
const admin = accounts[0]
let token1
let token2
let token3


module.exports = function(deployer) {
  Exchange.deployed()
    .then(async (exchange) => {
      let token1 = await Token1.deployed()
      let token2 = await Token2.deployed()
      let token3 = await Token3.deployed()

      await Promise.all(
        [
          token1.approve(exchange.address, 1000e18, { from: accounts[1]}),
          token1.approve(exchange.address, 1000e18, { from: accounts[2]}),
          token1.approve(exchange.address, 1000e18, { from: accounts[3]}),
          token1.approve(exchange.address, 1000e18, { from: accounts[4]}),
          token1.approve(exchange.address, 1000e18, { from: accounts[5]}),
          token1.approve(exchange.address, 1000e18, { from: accounts[6]}),
          token2.approve(exchange.address, 1000e18, { from: accounts[1]}),
          token2.approve(exchange.address, 1000e18, { from: accounts[2]}),
          token2.approve(exchange.address, 1000e18, { from: accounts[3]}),
          token2.approve(exchange.address, 1000e18, { from: accounts[4]}),
          token2.approve(exchange.address, 1000e18, { from: accounts[5]}),
          token2.approve(exchange.address, 1000e18, { from: accounts[6]}),
          token3.approve(exchange.address, 1000e18, { from: accounts[1]}),
          token3.approve(exchange.address, 1000e18, { from: accounts[2]}),
          token3.approve(exchange.address, 1000e18, { from: accounts[3]}),
          token3.approve(exchange.address, 1000e18, { from: accounts[4]}),
          token3.approve(exchange.address, 1000e18, { from: accounts[5]}),
          token3.approve(exchange.address, 1000e18, { from: accounts[6]}),
        ]
      )

      await Promise.all(
        [
          exchange.depositToken(token1.address, 1000e18, { from: accounts[1]}),
          exchange.depositToken(token1.address, 1000e18, { from: accounts[2]}),
          exchange.depositToken(token1.address, 1000e18, { from: accounts[3]}),
          exchange.depositToken(token1.address, 1000e18, { from: accounts[4]}),
          exchange.depositToken(token1.address, 1000e18, { from: accounts[5]}),
          exchange.depositToken(token1.address, 1000e18, { from: accounts[6]}),
          exchange.depositToken(token2.address, 1000e18, { from: accounts[1]}),
          exchange.depositToken(token2.address, 1000e18, { from: accounts[2]}),
          exchange.depositToken(token2.address, 1000e18, { from: accounts[3]}),
          exchange.depositToken(token2.address, 1000e18, { from: accounts[4]}),
          exchange.depositToken(token2.address, 1000e18, { from: accounts[5]}),
          exchange.depositToken(token2.address, 1000e18, { from: accounts[6]}),
          exchange.depositToken(token3.address, 1000e18, { from: accounts[1]}),
          exchange.depositToken(token3.address, 1000e18, { from: accounts[2]}),
          exchange.depositToken(token3.address, 1000e18, { from: accounts[3]}),
          exchange.depositToken(token3.address, 1000e18, { from: accounts[4]}),
          exchange.depositToken(token3.address, 1000e18, { from: accounts[5]}),
          exchange.depositToken(token3.address, 1000e18, { from: accounts[6]}),
        ]
      )

      await Promise.all(
        [
          exchange.depositEther({ from: accounts[1], value: 1e18 }),
          exchange.depositEther({ from: accounts[2], value: 1e18 }),
          exchange.depositEther({ from: accounts[3], value: 1e18 }),
          exchange.depositEther({ from: accounts[4], value: 1e18 }),
          exchange.depositEther({ from: accounts[5], value: 1e18 }),
          exchange.depositEther({ from: accounts[6], value: 1e18 }),
        ]
      )
    })
  }