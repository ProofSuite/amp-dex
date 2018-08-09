const WETH = artifacts.require('./contracts/utils/WETH9.sol');
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
let weth;


module.exports = function (deployer) {
    WETH.deployed()
        .then(async (_weth) => {
            weth = _weth;
            let deposits = []

            for(let account of accounts) {
              deposits.push(weth.deposit({ from: account, value: 1e18 }))
            }

            await Promise.all(deposits)
        })
};