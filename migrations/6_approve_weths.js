const WETH = artifacts.require('./contracts/utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');

const accounts = web3.eth.accounts;
let weth;
let exchange;


module.exports = function (deployer) {
    WETH.deployed()
        .then(async (_weth) => {
            weth = _weth;
            exchange = await Exchange.deployed();

            await Promise.all(
                [
                    weth.approve(exchange.address, 1e18, {from: accounts[1]}),
                    weth.approve(exchange.address, 1e18, {from: accounts[2]}),
                    weth.approve(exchange.address, 1e18, {from: accounts[3]}),
                    weth.approve(exchange.address, 1e18, {from: accounts[4]}),
                    weth.approve(exchange.address, 1e18, {from: accounts[5]}),
                    weth.approve(exchange.address, 1e18, {from: accounts[6]}),
                ]
            )
        })
};