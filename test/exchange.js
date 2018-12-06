/* global  artifacts:true, web3: true, contract: true */
import chai from 'chai'
import Web3 from 'web3'
import bnChai from 'bn-chai'
import { ether, wrappedEther } from './constants'

import { utils } from 'ethers'

import { expectRevert } from './helpers'
import {
    getCancelOrderAddresses,
    getCancelOrderValues,
    getOrderHash,
    getTradeHash,
    getMatchOrderAddresses,
    getMatchOrderValues
} from './utils/exchange'
import { getBalances } from './utils/balances'

chai
    .use(require('chai-bignumber')(web3.BigNumber))
    .use(bnChai(require('bn.js')))
    .should()

const WETH = artifacts.require('./utils/WETH9.sol')
const Exchange = artifacts.require('./Exchange.sol')
const BNB = artifacts.require('./contracts/tokens/BNB.sol')
const OMG = artifacts.require('./contracts/tokens/OMG.sol')
const TUSD = artifacts.require('./tokens/TUSD.sol')
const DAI = artifacts.require('./tokens/DAI.sol')
const etherPoints = web3.fromWei('10000')

contract('Exchange', (accounts) => {
  let web3 = new Web3('http://localhost:8545')

  let owner = accounts[0]
  let rewardAccount = accounts[1]
  let operator = accounts[2]
  let trader1 = accounts[3]
  let trader2 = accounts[4]
  let anyUser = accounts[5]

  let privateKeyOfTrader1 = '0x7c78c6e2f65d0d84c44ac0f7b53d6e4dd7a82c35f51b251d387c2a69df712663'
  let privateKeyOfTrader2 = '0x7c78c6e2f65d0d84c44ac0f7b53d6e4dd7a82c35f51b251d387c2a69df712664'

  let exchange
  let weth, bnb, tusd, dai
  let token1
  let token2

  let initialBalances

  describe('Initialisation', async () => {
    beforeEach(async () => {
      weth = await WETH.new()
      exchange = await Exchange.new(rewardAccount)
    })

    it('should initialise owner correctly', async () => {
      let initializedOwner = await exchange.owner.call()
      initializedOwner.should.be.equal(owner)
    })

    it('should initialise fee account correctly', async () => {
      let initializedRewardAccount = await exchange.rewardAccount.call()
      initializedRewardAccount.should.be.equal(rewardAccount)
    })
  })

  describe('Operator management', async () => {
    beforeEach(async () => {
      weth = await WETH.new()
      exchange = await Exchange.new(rewardAccount)
    })

    it('should set operator if requested by owner', async () => {
      let expectedOperator = accounts[2]
      await exchange.setOperator(expectedOperator, true, { from: owner })

      let isOperator = await exchange.operators.call(expectedOperator)
      isOperator.should.be.equal(true)

      await exchange.setOperator(expectedOperator, false, { from: owner })

      isOperator = await exchange.operators.call(expectedOperator)
      isOperator.should.be.equal(false)
    })

    it('should not set operator if not requested by owner', async () => {
      await exchange.setOperator(operator, true, { from: owner })

      let newOperator = accounts[7]
      await expectRevert(exchange.setOperator(newOperator, true, { from: operator }))
      await expectRevert(exchange.setOperator(newOperator, true, { from: anyUser }))
    })

    it('should not set zero address as operator', async () => {
      let newOperator = '0x0000000000000000000000000000000000000000'
      await expectRevert(exchange.setOperator(newOperator, true, { from: owner }))
    })
  })

  describe('Fee account management', async () => {
    beforeEach(async () => {
      weth = await WETH.new()
      exchange = await Exchange.new(rewardAccount)

      await exchange.setOperator(operator, true, { from: owner })
    })

    it('should set fee account if requested by owner', async () => {
      let expectedNewRewardAccount = accounts[3]
      await exchange.setRewardAccount(expectedNewRewardAccount, { from: owner })

      let newRewardAccount = await exchange.rewardAccount.call()
      newRewardAccount.should.be.equal(expectedNewRewardAccount)
    })

    it('should not set fee account if not requested by owner or operator', async () => {
      let expectedNewRewardAccount = accounts[3]
      await expectRevert(exchange.setRewardAccount(expectedNewRewardAccount, { from: operator }))
      await expectRevert(exchange.setRewardAccount(expectedNewRewardAccount, { from: anyUser }))
    })

    it('should not set zero address as fee account', async () => {
      let newRewardAccount = '0x0000000000000000000000000000000000000000'
      await expectRevert(exchange.setRewardAccount(newRewardAccount, { from: owner }))
    })
  })

  describe('Trading', async () => {
    describe('', async () => {
      beforeEach(async () => {
        let tokenAmount = web3.utils.toWei('10000', 'ether')

        weth = await WETH.new()
        token1 = await BNB.new(trader2, tokenAmount)
        token2 = await OMG.new(trader2, tokenAmount)

        exchange = await Exchange.new(rewardAccount)
        await exchange.setOperator(operator, true, { from: owner })

        await weth.deposit({ from: trader1, value: tokenAmount })
        await weth.approve(exchange.address, tokenAmount, { from: trader1 })
        await weth.approve(exchange.address, tokenAmount, { from: trader2 })
        await token1.approve(exchange.address, tokenAmount, { from: trader2 })

        initialBalances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
      })

      it('should execute trade', async () => {
        let makerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash = getOrderHash(exchange, takerOrder)
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader2)

        let orderValues = getMatchOrderValues(makerOrder, takerOrder)
        let orderAddresses = getMatchOrderAddresses(makerOrder, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues, orderAddresses, 1e17, [v1, v2], [r1, s1, r2, s2])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)

        makerOrderFill.should.be.bignumber.equal(makerOrder.amount)
        takerOrderFill.should.be.bignumber.equal(takerOrder.amount)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19)
      })

      it('should execute two identical orders with a different nonce', async () => {
        let makerOrder1 = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrder2 = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 2,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 2e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash1 = getOrderHash(exchange, makerOrder1)
        let makerOrderHash2 = getOrderHash(exchange, makerOrder2)
        let takerOrderHash = getOrderHash(exchange, takerOrder)

        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash1, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(makerOrderHash2, privateKeyOfTrader1)
        let { message: message3, messageHash: messageHash3, r: r3, s: s3, v: v3 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader2)

        let orderValues1 = getMatchOrderValues(makerOrder1, takerOrder)
        let orderAddresses1 = getMatchOrderAddresses(makerOrder1, takerOrder)

        let orderValues2 = getMatchOrderValues(makerOrder2, takerOrder)
        let orderAddresses2 = getMatchOrderAddresses(makerOrder2, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues1, orderAddresses1, 1e17, [v1, v3], [r1, s1, r3, s3])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let makerOrderFill1 = await exchange.filled.call(makerOrderHash1)
        let makerOrderFill2 = await exchange.filled.call(makerOrderHash2)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        makerOrderFill1.should.be.bignumber.equal(1e17)
        makerOrderFill2.should.be.bignumber.equal(0)
        takerOrderFill.should.be.bignumber.equal(1e17)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19)

        tx = await exchange.executeSingleTrade(orderValues2, orderAddresses2, 1e17, [v2, v3], [r2, s2, r3, s3])

        balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        makerOrderFill1 = await exchange.filled.call(makerOrderHash1)
        makerOrderFill2 = await exchange.filled.call(makerOrderHash2)
        takerOrderFill = await exchange.filled.call(takerOrderHash)
        makerOrderFill1.should.be.bignumber.equal(1e17)
        makerOrderFill2.should.be.bignumber.equal(1e17)
        takerOrderFill.should.be.bignumber.equal(2e17)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(2e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(2e19)
      })

      it('should not execute two identical orders with the same nonce', async () => {
        let makerOrder1 = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrder2 = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 2e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash1 = getOrderHash(exchange, makerOrder1)
        let makerOrderHash2 = getOrderHash(exchange, makerOrder2)
        let takerOrderHash = getOrderHash(exchange, takerOrder)

        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash1, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(makerOrderHash2, privateKeyOfTrader1)
        let { message: message3, messageHash: messageHash3, r: r3, s: s3, v: v3 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader2)

        let orderValues1 = getMatchOrderValues(makerOrder1, takerOrder)
        let orderAddresses1 = getMatchOrderAddresses(makerOrder1, takerOrder)

        let orderValues2 = getMatchOrderValues(makerOrder2, takerOrder)
        let orderAddresses2 = getMatchOrderAddresses(makerOrder2, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues1, orderAddresses1, 1e17, [v1, v3], [r1, s1, r3, s3])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let makerOrderFill1 = await exchange.filled.call(makerOrderHash1)
        let makerOrderFill2 = await exchange.filled.call(makerOrderHash2)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        makerOrderFill1.should.be.bignumber.equal(1e17)
        makerOrderFill2.should.be.bignumber.equal(1e17) // identical to makerOrderFill2 because it is the same hash
        takerOrderFill.should.be.bignumber.equal(1e17)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19)

        tx = await exchange.executeSingleTrade(orderValues2, orderAddresses2, 1e17, [v2, v3], [r2, s2, r3, s3])

        balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        makerOrderFill1 = await exchange.filled.call(makerOrderHash1)
        makerOrderFill2 = await exchange.filled.call(makerOrderHash2)
        takerOrderFill = await exchange.filled.call(takerOrderHash)
        makerOrderFill1.should.be.bignumber.equal(1e17)
        makerOrderFill2.should.be.bignumber.equal(1e17) // identical to makerOrderFill2 because it is the same hash
        takerOrderFill.should.be.bignumber.equal(1e17)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19)
      })

      it('should not execute trade if the sell pricepoint is above the buy pricepoint', async () => {
        let makerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8 - 1,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8 + 1,
          side: 1,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash = getOrderHash(exchange, takerOrder)
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader2)

        let orderValues = getMatchOrderValues(makerOrder, takerOrder)
        let orderAddresses = getMatchOrderAddresses(makerOrder, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues, orderAddresses, 1e17, [v1, v2], [r1, s1, r2, s2])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)

        makerOrderFill.should.be.bignumber.equal(0)
        takerOrderFill.should.be.bignumber.equal(0)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(0)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(0)
      })

      it('should not execute trade if both orders have the same side', async () => {
        let makerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash = getOrderHash(exchange, takerOrder)
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader2)

        let orderValues = getMatchOrderValues(makerOrder, takerOrder)
        let orderAddresses = getMatchOrderAddresses(makerOrder, takerOrder)
        let tx = await exchange.executeSingleTrade(orderValues, orderAddresses, 1e17, [v1, v2], [r1, s1, r2, s2])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)

        makerOrderFill.should.be.bignumber.equal(0)
        takerOrderFill.should.be.bignumber.equal(0)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(0)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(0)
      })

      it('should not execute trade if the signature is invalid', async () => {
        let makerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash = getOrderHash(exchange, takerOrder)

              // both messages are signed with the same private keys
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader1)

        let orderValues = getMatchOrderValues(makerOrder, takerOrder)
        let orderAddresses = getMatchOrderAddresses(makerOrder, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues, orderAddresses, 1e17, [v1, v2], [r1, s1, r2, s2])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)

        makerOrderFill.should.be.bignumber.equal(0)
        takerOrderFill.should.be.bignumber.equal(0)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(0)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(0)
      })

      it('should not execute the same order twice', async () => {
        let makerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder1 = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 0,
          feeTake: 0
        }

        let takerOrder2 = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 2,
          feeMake: 0,
          feeTake: 0
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash1 = getOrderHash(exchange, takerOrder1)
        let takerOrderHash2 = getOrderHash(exchange, takerOrder2)

              // both messages are signed with the same private keys
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash1, privateKeyOfTrader2)
        let { message: message3, messageHash: messageHash3, r: r3, s: s3, v: v3 } = web3.eth.accounts.sign(takerOrderHash2, privateKeyOfTrader2)

        let orderValues1 = getMatchOrderValues(makerOrder, takerOrder1)
        let orderAddresses1 = getMatchOrderAddresses(makerOrder, takerOrder1)

        let orderValues2 = getMatchOrderValues(makerOrder, takerOrder2)
        let orderAddresses2 = getMatchOrderAddresses(makerOrder, takerOrder2)

        let tx1 = await exchange.executeSingleTrade(orderValues1, orderAddresses1, 1e17, [v1, v2], [r1, s1, r2, s2])
        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)
        let takerOrderFill1 = await exchange.filled.call(takerOrderHash1)
        makerOrderFill.should.be.bignumber.equal(makerOrder.amount)
        takerOrderFill1.should.be.bignumber.equal(takerOrder1.amount)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19)

        let tx2 = await exchange.executeSingleTrade(orderValues2, orderAddresses2, 1e17, [v1, v3], [r1, s1, r3, s3])
        balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        makerOrderFill = await exchange.filled.call(makerOrderHash)
        takerOrderFill1 = await exchange.filled.call(takerOrderHash1)
        let takerOrderFill2 = await exchange.filled.call(takerOrderHash2)
        makerOrderFill.should.be.bignumber.equal(makerOrder.amount)
        takerOrderFill1.should.be.bignumber.equal(takerOrder1.amount)
        takerOrderFill2.should.be.bignumber.equal(0)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19)
      })

      it('should execute trade with fee (maker buys, taker sells)', async () => {
        let makerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let takerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash = getOrderHash(exchange, takerOrder)
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader1)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader2)

        let orderValues = getMatchOrderValues(makerOrder, takerOrder)
        let orderAddresses = getMatchOrderAddresses(makerOrder, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues, orderAddresses, 1e17, [v1, v2], [r1, s1, r2, s2])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)

        makerOrderFill.should.be.bignumber.equal(makerOrder.amount)
        takerOrderFill.should.be.bignumber.equal(takerOrder.amount)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.rewardAccountBalanceOfWETH.should.be.bignumber.equal(1e17) // receives both maker and taker fee (5e16 + 5e16 = 1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(995e16)
      })

      it('should execute trade with fee (maker sells, taker buys)', async () => {
        let makerOrder = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let takerOrder = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let makerOrderHash = getOrderHash(exchange, makerOrder)
        let takerOrderHash = getOrderHash(exchange, takerOrder)
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash, privateKeyOfTrader2)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash, privateKeyOfTrader1)

        let orderValues = getMatchOrderValues(makerOrder, takerOrder)
        let orderAddresses = getMatchOrderAddresses(makerOrder, takerOrder)

        let tx = await exchange.executeSingleTrade(orderValues, orderAddresses, 1e17, [v1, v2], [r1, s1, r2, s2])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let takerOrderFill = await exchange.filled.call(takerOrderHash)
        let makerOrderFill = await exchange.filled.call(makerOrderHash)

        makerOrderFill.should.be.bignumber.equal(makerOrder.amount)
        takerOrderFill.should.be.bignumber.equal(takerOrder.amount)
        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.rewardAccountBalanceOfWETH.should.be.bignumber.equal(1e17) // receives both maker and taker fee (5e16 + 5e16 = 1e17)
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19 - 5e16)
      })

      it('should pay fee proportionally to the order amount (maker sells, taker buys)', async () => {
        let makerOrder1 = {
          userAddress: trader2,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 1e17,
          pricepoint: 1e8,
          side: 1,
          salt: 1,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let takerOrder1 = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 5e16,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 1,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let takerOrder2 = {
          userAddress: trader1,
          baseToken: token1.address,
          quoteToken: weth.address,
          amount: 5e16,
          pricepoint: 1e8,
          side: 0, // BUY,
          salt: 2,
          feeMake: 5e16,
          feeTake: 5e16
        }

        let makerOrderHash1 = getOrderHash(exchange, makerOrder1)
        let takerOrderHash1 = getOrderHash(exchange, takerOrder1)
        let takerOrderHash2 = getOrderHash(exchange, takerOrder2)
        let { message: message1, messageHash: messageHash1, r: r1, s: s1, v: v1 } = web3.eth.accounts.sign(makerOrderHash1, privateKeyOfTrader2)
        let { message: message2, messageHash: messageHash2, r: r2, s: s2, v: v2 } = web3.eth.accounts.sign(takerOrderHash1, privateKeyOfTrader1)
        let { message: message3, messageHash: messageHash3, r: r3, s: s3, v: v3 } = web3.eth.accounts.sign(takerOrderHash2, privateKeyOfTrader1)

        let orderValues1 = getMatchOrderValues(makerOrder1, takerOrder1)
        let orderValues2 = getMatchOrderValues(makerOrder1, takerOrder2)
        let orderAddresses1 = getMatchOrderAddresses(makerOrder1, takerOrder1)
        let orderAddresses2 = getMatchOrderAddresses(makerOrder1, takerOrder2)

        let tx1 = await exchange.executeSingleTrade(orderValues1, orderAddresses1, 5e16, [v1, v2], [r1, s1, r2, s2])
        let tx2 = await exchange.executeSingleTrade(orderValues2, orderAddresses2, 5e16, [v1, v2], [r1, s1, r3, s3])

        let balances = await getBalances(trader1, trader2, rewardAccount, token1, token2, weth)
        let makerOrderFill1 = await exchange.filled.call(makerOrderHash1)
        let takerOrderFill1 = await exchange.filled.call(takerOrderHash1)
        let takerOrderFill2 = await exchange.filled.call(takerOrderHash2)

        makerOrderFill1.should.be.bignumber.equal(makerOrder1.amount)
        takerOrderFill1.should.be.bignumber.equal(takerOrder1.amount)
        takerOrderFill2.should.be.bignumber.equal(takerOrder2.amount)

        balances.trader1BalanceOfToken1.should.be.bignumber.equal(1e17)
        balances.rewardAccountBalanceOfWETH.should.be.bignumber.equal(15e16) // receive 2 takeFees from the takerOrders and one from the makerOrder
        balances.trader2BalanceOfWETH.should.be.bignumber.equal(1e19 - 5e16)
      })
    })
  })
})
