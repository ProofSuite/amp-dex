const Exchange = artifacts.require('./contracts/Exchange.sol');
const ProofToken = artifacts.require('./contracts/tokens/ProofToken.sol');
const RewardCollector = artifacts.require('./contracts/RewardCollector.sol');
const RewardPools = artifacts.require('./contracts/RewardPools.sol');

const mainnetProofTokenAddress = '0xc5cea8292e514405967d958c2325106f2f48da77'

module.exports = function (deployer, network, accounts) {
    let admin = accounts[0]
    let proofToken, rewardCollector, rewardPools

    deployer.deploy(RewardCollector)
    .then(async(result) => {
      rewardCollector = result
      if (network === 'ethereum') {
        return deployer.deploy(RewardPools, mainnetProofTokenAddress, rewardCollector.address)          
      } else {
        proofToken = await ProofToken.deployed()
        return deployer.deploy(RewardPools, proofToken.address, rewardCollector.address)  
      }
    })
}