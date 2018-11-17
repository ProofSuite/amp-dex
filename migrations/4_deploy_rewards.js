const Exchange = artifacts.require('./Exchange.sol');
const ProofToken = artifacts.require('./tokens/ProofToken.sol');
const RewardCollector = artifacts.require('./RewardCollector.sol');
const RewardPools = artifacts.require('./RewardPools.sol');

module.exports = function (deployer, network, accounts) {
    let admin = accounts[0]
    let weth;
    let exchange;

    if (network === 'development') {
      ProofToken.deployed().then(async(_proofToken) => {
        rewardCollector = await deployer.deploy(RewardCollector, _proofToken.address)
        rewardPools = await deployer.deploy(RewardPools, _proofToken.address, rewardCollector.address)
      })
    }

    if (network === 'rinkeby') {
      ProofToken.deployed().then(async(_proofToken) => {
        rewardCollector = await deployer.deploy(RewardCollector, _proofToken.address)
        rewardPools = await deployer.deploy(RewardPools, _proofToken.address, rewardCollector.address)
      })
    }
};
