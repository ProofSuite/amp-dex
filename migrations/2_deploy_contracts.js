const WETH = artifacts.require('./contracts/utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');
const Token1 = artifacts.require('./contracts/tokens/Token1.sol');
const Token2 = artifacts.require('./contracts/tokens/Token2.sol');
const Token3 = artifacts.require('./contracts/tokens/Token3.sol');

const accounts = web3.eth.accounts;
const admin = accounts[0];
let weth;
let exchnage;
let token1;
let token2;
let token3;


module.exports = function (deployer) {
    deployer.deploy(WETH).then(async (_weth) => {
        weth = _weth;
        exchnage = await deployer.deploy(Exchange, weth.address, admin);
        token1 = await deployer.deploy(Token1, admin, 100000e18);
        token2 = await deployer.deploy(Token2, admin, 100000e18);
        token3 = await deployer.deploy(Token3, admin, 100000e18);
    })
};
