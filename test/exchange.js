/* global  artifacts:true, web3: true, contract: true */
import chai from 'chai'
import Web3 from 'web3'
import bnChai from 'bn-chai'

chai
    .use(require('chai-bignumber')(web3.BigNumber))
    .use(bnChai(require('bn.js')))
    .should();

const WETH = artifacts.require('./utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');

contract('Exchange', (accounts) => {

    let owner = accounts[0];
    let feeAccount = accounts[1];

    let exchange;
    let weth;

    describe('Initialisation', async () => {
        beforeEach(async () => {
            weth = await WETH.new();
            exchange = await Exchange.new(weth.address, feeAccount)
        });

        it('should initialise owner correctly', async () => {
            let initializedOwner = await exchange.owner.call();
            initializedOwner.should.be.equal(owner)
        });

        it('should initialise fee account correctly', async () => {
            let initializedFeeAccount = await exchange.feeAccount.call();
            initializedFeeAccount.should.be.equal(feeAccount)
        });

        it('should initialise WETH token contract correctly', async () => {
            let initializedWethTokenContract = await exchange.WETH_TOKEN_CONTRACT.call();
            initializedWethTokenContract.should.be.equal(weth.address)
        })
    });

});
