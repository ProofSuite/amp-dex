const ProofToken = artifacts.require('./contracts/tokens/ProofToken.sol')

module.exports = function (deployer, network, accounts) {
  deployer.deploy(ProofToken)
};