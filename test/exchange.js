/* global  artifacts:true, web3: true, contract: true */
import chai from 'chai'
import Web3 from 'web3'
import bnChai from 'bn-chai'
import {ether, wrappedEther} from './constants'
import {expectRevert} from './helpers'
import {getCancelOrderAddresses, getCancelOrderValues, getOrderHash} from "./utils/exchange";

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
    let trader1 = accounts[3];
    let trader2 = accounts[4];
    let anyUser = accounts[5];

    let privateKeyOfTrader1 = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203';
    let privateKeyOfTrader2 = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204';

    let exchange;
    let weth;
    let token1;
    let token2;

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

    describe('Operator management', async () => {
        beforeEach(async () => {
            weth = await WETH.new();
            exchange = await Exchange.new(weth.address, feeAccount)
        });

        it('should set operator if requested by owner', async () => {
            let expectedOperator = accounts[2];
            await exchange.setOperator(expectedOperator, true, {from: owner});

            let isOperator = await exchange.operators.call(expectedOperator);
            isOperator.should.be.equal(true);

            await exchange.setOperator(expectedOperator, false, {from: owner});

            isOperator = await exchange.operators.call(expectedOperator);
            isOperator.should.be.equal(false)
        });

        it('should not set operator if not requested by owner', async () => {
            await exchange.setOperator(operator, true, {from: owner});

            let newOperator = accounts[7];
            await expectRevert(exchange.setOperator(newOperator, true, {from: operator}));
            await expectRevert(exchange.setOperator(newOperator, true, {from: anyUser}))
        })
    });

    describe('Fee account management', async () => {
        beforeEach(async () => {
            weth = await WETH.new();
            exchange = await Exchange.new(weth.address, feeAccount);

            await exchange.setOperator(operator, true, {from: owner})
        });

        it('should set fee account if requested by owner', async () => {
            let expectedNewFeeAccount = accounts[3];
            await exchange.setFeeAccount(expectedNewFeeAccount, {from: owner});

            let newFeeAccount = await exchange.feeAccount.call();
            newFeeAccount.should.be.equal(expectedNewFeeAccount)
        });

        it('should set fee account if requested by operator', async () => {
            let expectedNewFeeAccount = accounts[3];
            await exchange.setFeeAccount(expectedNewFeeAccount, {from: operator});

            let newFeeAccount = await exchange.feeAccount.call();
            newFeeAccount.should.be.equal(expectedNewFeeAccount)
        });

        it('should not set fee account if not requested by owner or operator', async () => {
            let expectedNewFeeAccount = accounts[3];
            await expectRevert(exchange.setFeeAccount(expectedNewFeeAccount, {from: anyUser}))
        })
    });

    describe('Cancelling order', async () => {
        beforeEach(async () => {
            weth = await WETH.new();
            exchange = await Exchange.new(weth.address, feeAccount);
            token1 = await Token1.new(trader1, 1000);
            token2 = await Token2.new(trader2, 1000);

            await exchange.setOperator(operator, true, {from: owner});

            await weth.deposit({from: trader1, value: ether});
            weth.approve(exchange.address, wrappedEther, {from: trader1});

            await weth.deposit({from: trader2, value: ether});
            weth.approve(exchange.address, wrappedEther, {from: trader2});

            await token1.approve(exchange.address, 1000, {from: trader1});
            await token2.approve(exchange.address, 1000, {from: trader2})
        });

        it('should execute if requested by maker of order', async () => {
            let initialBlockNumber = await web3.eth.getBlockNumber();

            let order = {
                amountBuy: 1000,
                amountSell: 1000,
                expires: initialBlockNumber + 10,
                nonce: 1,
                feeMake: 1e17,
                feeTake: 1e17,
                tokenBuy: token2.address,
                tokenSell: token1.address,
                maker: trader1
            };

            let orderHash = getOrderHash(exchange, order);

            let {message, messageHash, r, s, v} = web3.eth.accounts.sign(orderHash, privateKeyOfTrader1);

            let cancelOrderValues = getCancelOrderValues(order);
            let cancelOrderAddresses = getCancelOrderAddresses(order);

            await exchange.cancelOrder(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: trader1});

            let orderFill = await exchange.filled.call(orderHash);
            orderFill.should.be.bignumber.equal(order.amountBuy)
        });

        it('should not execute if not requested by maker of order', async () => {
            let initialBlockNumber = await web3.eth.getBlockNumber();

            let order = {
                amountBuy: 1000,
                amountSell: 1000,
                expires: initialBlockNumber + 10,
                nonce: 1,
                feeMake: 1e17,
                feeTake: 1e17,
                tokenBuy: token2.address,
                tokenSell: token1.address,
                maker: trader1
            };

            let orderHash = getOrderHash(exchange, order);

            let {message, messageHash, r, s, v} = web3.eth.accounts.sign(orderHash, privateKeyOfTrader1);

            let cancelOrderValues = getCancelOrderValues(order);
            let cancelOrderAddresses = getCancelOrderAddresses(order);

            let orderCancellationResultForOwner = await exchange.cancelOrder.call(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: owner});

            let orderCancellationResultForOperator = await exchange.cancelOrder.call(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: operator});

            let orderCancellationResultForAnyUser = await exchange.cancelOrder.call(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: anyUser});

            orderCancellationResultForOwner.should.be.equal(false);
            orderCancellationResultForOperator.should.be.equal(false);
            orderCancellationResultForAnyUser.should.be.equal(false);

            await exchange.cancelOrder(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: owner});

            let orderFillAfterOrderCancelByOwner = await exchange.filled.call(orderHash);
            orderFillAfterOrderCancelByOwner.should.be.bignumber.equal(0);

            await exchange.cancelOrder(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: operator});

            let orderFillAfterOrderCancelByOperator = await exchange.filled.call(orderHash);
            orderFillAfterOrderCancelByOperator.should.be.bignumber.equal(0);

            await exchange.cancelOrder(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: anyUser});

            let orderFillAfterOrderCancelByAnyUser = await exchange.filled.call(orderHash);
            orderFillAfterOrderCancelByAnyUser.should.be.bignumber.equal(0);
        });

        it('should not execute if maker signature is invalid', async () => {
            let initialBlockNumber = await web3.eth.getBlockNumber();

            let order = {
                amountBuy: 1000,
                amountSell: 1000,
                expires: initialBlockNumber + 10,
                nonce: 1,
                feeMake: 1e17,
                feeTake: 1e17,
                tokenBuy: token2.address,
                tokenSell: token1.address,
                maker: trader1
            };

            let orderHash = getOrderHash(exchange, order);

            let {message, messageHash, r, s, v} = web3.eth.accounts.sign(orderHash, privateKeyOfTrader2);

            let cancelOrderValues = getCancelOrderValues(order);
            let cancelOrderAddresses = getCancelOrderAddresses(order);

            let orderCancellationResult = await exchange.cancelOrder.call(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: trader1});

            orderCancellationResult.should.be.equal(false);

            await exchange.cancelOrder(
                cancelOrderValues,
                cancelOrderAddresses,
                v,
                r,
                s,
                {from: trader1});

            let orderFill = await exchange.filled.call(orderHash);
            orderFill.should.be.bignumber.equal(0);
        })
    });

});
