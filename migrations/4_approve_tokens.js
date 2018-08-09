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
let weth;
let exchange;
let tokens = []


module.exports = function (deployer) {
    WETH.deployed()
        .then(async (_weth) => {
            weth = _weth;
            exchange = await Exchange.deployed();
            tokens[0] = await Token1.deployed();
            tokens[1] = await Token2.deployed();
            tokens[2] = await Token3.deployed();
            tokens[3] = await Token4.deployed();
            tokens[4] = await Token5.deployed();
            tokens[5] = await Token6.deployed();
            tokens[6] = await Token7.deployed();
            tokens[7] = await Token8.deployed();
            tokens[8] = await Token9.deployed();
            tokens[9] = await Token10.deployed();
            tokens[10] = await Token11.deployed();
            tokens[11] = await Token12.deployed();
            tokens[12] = await Token13.deployed();
            tokens[13] = await Token14.deployed();
            tokens[14] = await Token15.deployed();
            tokens[15] = await Token16.deployed();
            tokens[16] = await Token17.deployed();
            tokens[17] = await Token18.deployed();
            tokens[18] = await Token19.deployed();
            tokens[19] = await Token20.deployed();


            let tokenApprovals = []

            for(let token of tokens) {
              for(let account of accounts) {
                tokenApprovals.push(token.approve(exchange.address, 1000e18, { from: account }))
              }
            }

            try {
              await Promise.all(tokenApprovals)
            } catch (e) {
              console.log(e)
            }

        })
}