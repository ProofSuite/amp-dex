const Exchange = artifacts.require('./contracts/Exchange.sol');
const ProofToken = artifacts.require('./contracts/tokens/ProofToken.sol');
const SetupAccount = artifacts.require('./contracts/SetupAccount.sol')
const WETH = artifacts.require('./contracts/WETH9.sol');


module.exports = function (deployer, network, accounts) {
    let admin = accounts[0]
    let proofToken, rewardCollector, rewardPools

    deployer.then(function(){
        return Exchange.deployed()
    })
    .then(async(exchange) => {
        if (network === 'ethereum') {
             let wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
             return deployer.deploy(SetupAccount, exchange.address, weth.address)
        } else {
            let weth = await WETH.deployed()
            console.log(exchange.address)
            console.log(weth.address)
            return deployer.deploy(SetupAccount, exchange.address, weth.address)
        }
    })
}