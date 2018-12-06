/* global  artifacts:true, web3: true, contract: true */
import chai from 'chai'
import Web3 from 'web3'
import bnChai from 'bn-chai'
import { ether, wrappedEther } from './constants'
import { utils } from 'ethers'
import { expectRevert, waitUntilTransactionsMined } from './helpers'

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
const Exchange = artifacts.require('./utils/Exchange.sol')
const BNB = artifacts.require('./contracts/tokens/BNB.sol')
const OMG = artifacts.require('./contracts/tokens/OMG.sol')
const DAI = artifacts.require('./tokens/DAI.sol')
const SetupAccount = artifacts.require('./SetupAccount.sol')
const etherPoints = web3.fromWei('10000')

contract('SetupAccount', accounts => {
  let weth, exchange, bnb, usd, dai, omg, setupAccount

  let user1 = accounts[1]
  let user2 = accounts[2]
  let rewardAccount = accounts[9]

  describe('Initialization', async () => {
    beforeEach(async () => {
      weth = await WETH.new()
      exchange = await Exchange.new(rewardAccount)
    })

    it('should set the weth and exchange address correctly', async () => {
      setupAccount = await SetupAccount.new(weth.address, exchange.address)

      let exchangeAddress = await setupAccount.exchangeAddress.call()
      exchangeAddress.should.be.equal(exchange.address)

      let wethAddress = await setupAccount.wethAddress.call()
      wethAddress.should.be.equal(weth.address)
    })
  })

  describe('setupAccount', async () => {
    beforeEach(async () => {
      weth = await WETH.new()
      exchange = await Exchange.new(rewardAccount)
      bnb = await BNB.new(user1, 1000)
      dai = await DAI.new(user1, 1000)
      omg = await OMG.new(user1, 1000)
      setupAccount = await SetupAccount.new(weth.address, exchange.address)
    })

    it('setupAccount should deposit weth and approve tokens', async () => {
      await setupAccount.setup(
        [bnb.address, dai.address, omg.address],
        [1000, 1000, 1000],
        { value: 10 ** 18, from: user1 }
      )
      
      let bnbAllowance = await bnb.allowance(user1, exchange.address)
      let daiAllowance = await dai.allowance(user1, exchange.address)
      let omgAllowance = await omg.allowance(user1, exchange.address)
      let wethBalance = await weth.balanceOf(user1)

      wethBalance.should.be.bignumber.equal(10 ** 18)
      bnbAllowance.should.be.bignumber.equal(1000)
      daiAllowance.should.be.bignumber.equal(1000)
      omgAllowance.should.be.bignumber.equal(1000)
    })
  })
})
