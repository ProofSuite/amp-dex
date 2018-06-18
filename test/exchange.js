/* global  artifacts:true, web3: true, contract: true */
import chai from 'chai'
import Web3 from 'web3'
import bnChai from 'bn-chai'
import {expectRevert} from './helpers'

chai
    .use(require('chai-bignumber')(web3.BigNumber))
    .use(bnChai(require('bn.js')))
    .should();

const WETH = artifacts.require('./utils/WETH9.sol');
const Exchange = artifacts.require('./Exchange.sol');
const Token1 = artifacts.require('./contracts/tokens/Token1.sol');
const Token2 = artifacts.require('./contracts/tokens/Token2.sol');

contract('Exchange', (accounts) => {
    let web3 = new Web3('http://localhost:8545');

    let owner = accounts[0];
    let feeAccount = accounts[1];
    let operator = accounts[2];
    let anyUser = accounts[5];

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

    describe('WETH token management', async () => {
        beforeEach(async () => {
            weth = await WETH.new();
            exchange = await Exchange.new(weth.address, feeAccount)
        });

        it('should set WETH token address if requested by owner', async () => {
            let expectedWethTokenAddress = accounts[6];
            await exchange.setWethToken(expectedWethTokenAddress, {from: owner});

            let wethTokenContractAddress = await exchange.WETH_TOKEN_CONTRACT.call();
            wethTokenContractAddress.should.be.equal(expectedWethTokenAddress)
        });

        it('should not set WETH token address if not requested by owner', async () => {
            await exchange.setOperator(operator, true, {from: owner});
            let newWethTokenAddress = accounts[6];
            await expectRevert(exchange.setWethToken(newWethTokenAddress, {from: operator}));
            await expectRevert(exchange.setWethToken(newWethTokenAddress, {from: anyUser}))
        })
    });

});
