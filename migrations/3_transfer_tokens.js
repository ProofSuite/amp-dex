const Token1 = artifacts.require('./contracts/tokens/Token1.sol');
const Token2 = artifacts.require('./contracts/tokens/Token2.sol');
const Token3 = artifacts.require('./contracts/tokens/Token3.sol');

const accounts = web3.eth.accounts;
const admin = accounts[0];
let token1;
let token2;
let token3;


module.exports = function (deployer) {
    Token1.deployed()
        .then(async (_token1) => {
            token1 = _token1;
            token2 = await Token2.deployed();
            token3 = await Token3.deployed();

            await Promise.all(
                [

                    token1.transfer(accounts[1], 1000e18, {from: admin}),
                    token1.transfer(accounts[2], 1000e18, {from: admin}),
                    token1.transfer(accounts[3], 1000e18, {from: admin}),
                    token1.transfer(accounts[4], 1000e18, {from: admin}),
                    token1.transfer(accounts[5], 1000e18, {from: admin}),
                    token1.transfer(accounts[6], 1000e18, {from: admin}),

                    token2.transfer(accounts[1], 1000e18, {from: admin}),
                    token2.transfer(accounts[2], 1000e18, {from: admin}),
                    token2.transfer(accounts[3], 1000e18, {from: admin}),
                    token2.transfer(accounts[4], 1000e18, {from: admin}),
                    token2.transfer(accounts[5], 1000e18, {from: admin}),
                    token2.transfer(accounts[6], 1000e18, {from: admin}),

                    token3.transfer(accounts[1], 1000e18, {from: admin}),
                    token3.transfer(accounts[2], 1000e18, {from: admin}),
                    token3.transfer(accounts[3], 1000e18, {from: admin}),
                    token3.transfer(accounts[4], 1000e18, {from: admin}),
                    token3.transfer(accounts[5], 1000e18, {from: admin}),
                    token3.transfer(accounts[6], 1000e18, {from: admin}),
                ]
            )
        })
}