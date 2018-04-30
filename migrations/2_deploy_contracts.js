const Exchange = artifacts.require('./Exchange.sol')

module.exports = function(deployer) {
  deployer.deploy(Exchange, 10000)
    .then(() => {
      Exchange.deployed()
      .then((exchange) => {
        exchange.setWithdrawalSecurityPeriod(10000)
      })
    })
};
