const WETH = artifacts.require('./contracts/utils/WETH9.sol');
const ProofToken = artifacts.require('./contracts/ProofToken.sol');
const RewardCollector = artifacts.require('./contracts/utils/RewardCollector.sol')

module.exports = function (deployer, network, accounts) {
    let admin = accounts[0]

    if (network !== 'ethereum') {
      deployer.deploy(WETH)
    }
    
};
