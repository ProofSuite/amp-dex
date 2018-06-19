const WETH = artifacts.require('./contracts/utils/WETH9.sol');

const accounts = web3.eth.accounts;
let weth;


module.exports = function (deployer) {
    WETH.deployed()
        .then(async (_weth) => {
            weth = _weth;

            await Promise.all(
                [
                    weth.deposit({from: accounts[1], value: 1e18}),
                    weth.deposit({from: accounts[2], value: 1e18}),
                    weth.deposit({from: accounts[3], value: 1e18}),
                    weth.deposit({from: accounts[4], value: 1e18}),
                    weth.deposit({from: accounts[5], value: 1e18}),
                    weth.deposit({from: accounts[6], value: 1e18}),
                ]
            )
        })
};