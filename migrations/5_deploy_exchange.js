const WETH = artifacts.require('./contracts/utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');


module.exports = function (deployer, network, accounts) {
    let admin = accounts[0]
    let weth;
    let exchange;

    WETH.deployed().then(async(_weth) => {
      weth = _weth
      deployer.deploy(Exchange, weth.address, admin)
    })
};
