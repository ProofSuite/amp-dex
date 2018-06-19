const WETH = artifacts.require('./contracts/utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');
const Token1 = artifacts.require('./contracts/tokens/Token1.sol');
const Token2 = artifacts.require('./contracts/tokens/Token2.sol');
const Token3 = artifacts.require('./contracts/tokens/Token3.sol');

const accounts = web3.eth.accounts;
let weth;
let exchange;
let token1;
let token2;
let token3;


module.exports = function (deployer) {
    WETH.deployed()
        .then(async (_weth) => {
            weth = _weth;
            exchange = await Exchange.deployed();
            token1 = await Token1.deployed();
            token2 = await Token2.deployed();
            token3 = await Token3.deployed();

            await Promise.all(
                [
                    token1.approve(exchange.address, 1000e18, {from: accounts[1]}),
                    token1.approve(exchange.address, 1000e18, {from: accounts[2]}),
                    token1.approve(exchange.address, 1000e18, {from: accounts[3]}),
                    token1.approve(exchange.address, 1000e18, {from: accounts[4]}),
                    token1.approve(exchange.address, 1000e18, {from: accounts[5]}),
                    token1.approve(exchange.address, 1000e18, {from: accounts[6]}),

                    token2.approve(exchange.address, 1000e18, {from: accounts[1]}),
                    token2.approve(exchange.address, 1000e18, {from: accounts[2]}),
                    token2.approve(exchange.address, 1000e18, {from: accounts[3]}),
                    token2.approve(exchange.address, 1000e18, {from: accounts[4]}),
                    token2.approve(exchange.address, 1000e18, {from: accounts[5]}),
                    token2.approve(exchange.address, 1000e18, {from: accounts[6]}),

                    token3.approve(exchange.address, 1000e18, {from: accounts[1]}),
                    token3.approve(exchange.address, 1000e18, {from: accounts[2]}),
                    token3.approve(exchange.address, 1000e18, {from: accounts[3]}),
                    token3.approve(exchange.address, 1000e18, {from: accounts[4]}),
                    token3.approve(exchange.address, 1000e18, {from: accounts[5]}),
                    token3.approve(exchange.address, 1000e18, {from: accounts[6]}),
                ]
            )
        })
}