const WETH = artifacts.require('./contracts/utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');
const Token1 = artifacts.require('./contracts/tokens/Token1.sol');
const Token2 = artifacts.require('./contracts/tokens/Token2.sol');
const Token3 = artifacts.require('./contracts/tokens/Token3.sol');
const Token4 = artifacts.require('./contracts/tokens/Token4.sol');
const Token5 = artifacts.require('./contracts/tokens/Token5.sol');
const Token6 = artifacts.require('./contracts/tokens/Token6.sol');
const Token7 = artifacts.require('./contracts/tokens/Token7.sol');
const Token8 = artifacts.require('./contracts/tokens/Token8.sol');
const Token9 = artifacts.require('./contracts/tokens/Token9.sol');
const Token10 = artifacts.require('./contracts/tokens/Token10.sol');
const Token11 = artifacts.require('./contracts/tokens/Token11.sol');
const Token12 = artifacts.require('./contracts/tokens/Token12.sol');
const Token13 = artifacts.require('./contracts/tokens/Token13.sol');
const Token14 = artifacts.require('./contracts/tokens/Token14.sol');
const Token15 = artifacts.require('./contracts/tokens/Token15.sol');
const Token16 = artifacts.require('./contracts/tokens/Token16.sol');
const Token17 = artifacts.require('./contracts/tokens/Token17.sol');
const Token18 = artifacts.require('./contracts/tokens/Token18.sol');
const Token19 = artifacts.require('./contracts/tokens/Token19.sol');
const Token20 = artifacts.require('./contracts/tokens/Token20.sol');

const accounts = web3.eth.accounts;
const admin = accounts[0];
let weth;
let exchange;
let token1;
let token2;
let token3;


module.exports = function (deployer) {
    deployer.deploy(WETH).then(async (_weth) => {
        weth = _weth;
        exchange = await deployer.deploy(Exchange, weth.address, admin);
        token1 = await deployer.deploy(Token1, admin, 100000e18);
        token2 = await deployer.deploy(Token2, admin, 100000e18);
        token3 = await deployer.deploy(Token3, admin, 100000e18);
        token4 = await deployer.deploy(Token4, admin, 100000e18);
        token5 = await deployer.deploy(Token5, admin, 100000e18);
        token6 = await deployer.deploy(Token6, admin, 100000e18);
        token7 = await deployer.deploy(Token7, admin, 100000e18);
        token8 = await deployer.deploy(Token8, admin, 100000e18);
        token9 = await deployer.deploy(Token9, admin, 100000e18);
        token10 = await deployer.deploy(Token10, admin, 100000e18);
        token11 = await deployer.deploy(Token11, admin, 100000e18);
        token12 = await deployer.deploy(Token12, admin, 100000e18);
        token13 = await deployer.deploy(Token13, admin, 100000e18);
        token14 = await deployer.deploy(Token14, admin, 100000e18);
        token15 = await deployer.deploy(Token15, admin, 100000e18);
        token16 = await deployer.deploy(Token16, admin, 100000e18);
        token17 = await deployer.deploy(Token17, admin, 100000e18);
        token18 = await deployer.deploy(Token18, admin, 100000e18);
        token19 = await deployer.deploy(Token19, admin, 100000e18);
        token20 = await deployer.deploy(Token20, admin, 100000e18);
    })
};
