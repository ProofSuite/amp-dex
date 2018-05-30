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
  deployer.deploy(Exchange, 10000)
    .then(async () => {
      await deployer.deploy(Token1, admin, 100000e18)
      await deployer.deploy(Token2, admin, 100000e18)
      await deployer.deploy(Token3, admin, 100000e18)

      let exchange = await Exchange.deployed()
      let token1 = await Token1.deployed()
      let token2 = await Token2.deployed()
      let token3 = await Token3.deployed()

      await exchange.setWithdrawalSecurityPeriod(10000)
    })
  }


  // await Promise.all(
  //   [
  //     token1.transfer(accounts[1], 1000e18, { from: admin }),
  //     token1.transfer(accounts[2], 1000e18, { from: admin }),
  //     token1.transfer(accounts[3], 1000e18, { from: admin }),
  //     token1.transfer(accounts[4], 1000e18, { from: admin }),
  //     token1.transfer(accounts[5], 1000e18, { from: admin }),
  //     token1.transfer(accounts[6], 1000e18, { from: admin }),
  //     token2.transfer(accounts[1], 1000e18, { from: admin }),
  //     token2.transfer(accounts[2], 1000e18, { from: admin }),
  //     token2.transfer(accounts[3], 1000e18, { from: admin }),
  //     token2.transfer(accounts[4], 1000e18, { from: admin }),
  //     token2.transfer(accounts[5], 1000e18, { from: admin }),
  //     token2.transfer(accounts[6], 1000e18, { from: admin }),
  //     token3.transfer(accounts[1], 1000e18, { from: admin }),
  //     token3.transfer(accounts[2], 1000e18, { from: admin }),
  //     token3.transfer(accounts[3], 1000e18, { from: admin }),
  //     token3.transfer(accounts[4], 1000e18, { from: admin }),
  //     token3.transfer(accounts[5], 1000e18, { from: admin }),
  //     token3.transfer(accounts[6], 1000e18, { from: admin }),
  //   ]
  // )


      // .then((exchange) => {
      //   exchange.setWithdrawalSecurityPeriod(10000)
      // })
      // .then(() => {
      //   deployer.deploy(Token1, admin, 20e18)
      //   .then(() => {
      //     Token1.deployed()

      //     .then(async(token1) => {
      //       console.log(`Token 1 has been deployed at address ${token1.address}`)
      //       let supply = await token1.totalSupply()
      //       console.log(supply.toNumber())
      //       let balance = await token1.balanceOf(admin)
      //       console.log(balance.toNumber())


      //     })
      //   })
      // })
      // .then(() => {
      //   deployer.deploy(Token2, admin, 10e18)
      //     .then(() => {
      //       Token2.deployed()
      //       .then(async(token2) => {
      //         console.log(`Token 2 has been deployed at address ${token2.address}`)
      //         await Promise.all(
      //           [
      //             token2.transfer(accounts[1], 1e18, { from: admin }),
      //             token2.transfer(accounts[2], 1e18, { from: admin }),
      //             token2.transfer(accounts[3], 1e18, { from: admin }),
      //             token2.transfer(accounts[4], 1e18, { from: admin }),
      //             token2.transfer(accounts[4], 1e18, { from: admin }),
      //             token2.transfer(accounts[5], 1e18, { from: admin }),
      //             token2.transfer(accounts[6], 1e18, { from: admin })
      //           ]
      //         )
      //       })
      //     })
      //   })

