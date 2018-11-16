/* global  artifacts:true, web3: true, contract: true */
import chaiAsPromised from 'chai-as-promised'
import chai from 'chai'
import { expectRevert, advanceToBlock, computeEpoch } from './helpers'

chai.use(chaiAsPromised)
.use(require('chai-bignumber')(web3.BigNumber))
.should()

const RewardPools = artifacts.require('./RewardPools.sol')
const RewardCollector = artifacts.require('./RewardCollector.sol')
const ProofToken = artifacts.require('./tokens/ProofToken.sol')
const TUSD = artifacts.require('./tokens/TUSD.sol')
const DAI = artifacts.require('./tokens/DAI.sol')

contract('Rewards', (accounts) => {
  let rewards
  let proofToken, rewardCollector, rewardPools, dai, tusd
  let blocksPerEpoch
  let defaultGasPrice = 10 * 10 ** 9
  let ether = 10 ** 18

  let fund = accounts[0]
  let wallet = accounts[1]
  let wallet2 = accounts[2]
  let wallet3 = accounts[3]
  let wallet4 = accounts[4]
  let defaultReward = { from: fund, value: 1 * ether, gasPrice: defaultGasPrice }
  let defaultParams = { from: wallet, gasPrice: defaultGasPrice }

  let creationBlockNumber, epoch1, epoch2, epoch3

  beforeEach(async() => {
    blocksPerEpoch = 20
  })

  describe('Receive rewards', async() => {
    beforeEach(async() => {
      // We mint 1000 tokens and transfer half of them to the testing wallet address
      let mintedTokens = 10000000000e18

      proofToken = await ProofToken.new()
      await proofToken.mint(fund, 1000)

      rewardCollector = await RewardCollector.new(proofToken.address)
      rewardPools = await RewardPools.new(proofToken.address, rewardCollector.address)
      tusd = await TUSD.new(fund, mintedTokens)
      dai = await DAI.new(fund, mintedTokens)

      await rewardPools.registerQuoteToken(tusd.address)
      await rewardPools.registerQuoteToken(dai.address)
      await rewardCollector.setRewardPools(rewardPools.address)

      await proofToken.transfer(wallet, 250, { from: fund })
      await proofToken.transfer(wallet2, 250, { from: fund })
      await proofToken.transfer(wallet3, 250, { from: fund })
      await proofToken.transfer(wallet4, 250, { from: fund })

      creationBlockNumber = await rewardPools.creationBlockNumber.call()
      epoch1 = creationBlockNumber.plus(blocksPerEpoch).toNumber()
      epoch2 = creationBlockNumber.plus(2 * blocksPerEpoch).toNumber()
      epoch3 = creationBlockNumber.plus(3 * blocksPerEpoch).toNumber()
    })

    it('should update the reward collector token balance when transferring tokens', async() => {
      await tusd.transfer(rewardCollector.address, 500, { from: fund })

      let rewardCollectorBalance = await tusd.balanceOf(rewardCollector.address)
      rewardCollectorBalance.should.be.bignumber.equal(500)
    })

    it('should update the reward collector token balance when transferring tokens (with TransferFrom)', async() => {
      await tusd.approve(wallet, 500, { from: fund })
      await tusd.transferFrom(fund, rewardCollector.address, 500, { from: wallet })

      let rewardCollectorBalance = await tusd.balanceOf(rewardCollector.address)
      rewardCollectorBalance.should.be.bignumber.equal(500)
    })

    it('should not transfer tokens to withdrawRewards caller if the epoch is not finished', async() => {
      await tusd.transfer(rewardCollector.address, 1000, { from: fund })
      await rewardPools.withdrawRewards({ from: wallet })

      let walletTUSDBalance = await tusd.balanceOf(wallet)
      walletTUSDBalance.should.be.bignumber.equal(0)
    })

    it('should transfer tokens to first pool but not to caller if withdrawRewards is called during epoch1', async() => {
      await tusd.transfer(rewardCollector.address, 1000, { from: fund })

      await advanceToBlock(epoch1)
      await rewardPools.withdrawRewards({ from: wallet })

      let walletTUSDBalance = await tusd.balanceOf(wallet)
      let rewardsPoolContractTUSDBalance = await tusd.balanceOf(rewardPools.address)
      let rewardsPoolFirstPoolBalance = await rewardPools.balanceOfPool.call(0, tusd.address)
      let rewardsPoolSecondPoolBalance = await rewardPools.balanceOfPool.call(1, tusd.address)
      let rewardsPoolThirdPoolBalance = await rewardPools.balanceOfPool.call(2, tusd.address)

      walletTUSDBalance.should.be.bignumber.equal(0)
      rewardsPoolContractTUSDBalance.should.be.bignumber.equal(1000)
      rewardsPoolFirstPoolBalance.should.be.bignumber.equal(1000)
    })

    it('should transfer tokens to first pool and partially to caller if withdrawRewards 1', async() => {
      await tusd.transfer(rewardCollector.address, 1000, { from: fund })

      await advanceToBlock(epoch2)
      await rewardPools.withdrawRewards({ from: wallet })

      let walletTUSDBalance = await tusd.balanceOf(wallet)
      let rewardsPoolContractTUSDBalance = await tusd.balanceOf(rewardPools.address)
      let rewardsPoolFirstPoolBalance = await rewardPools.balanceOfPool.call(0, tusd.address)
      let rewardsPoolSecondPoolBalance = await rewardPools.balanceOfPool.call(1, tusd.address)
      let rewardsPoolThirdPoolBalance = await rewardPools.balanceOfPool.call(2, tusd.address)

      walletTUSDBalance.should.be.bignumber.equal(250)
      rewardsPoolContractTUSDBalance.should.be.bignumber.equal(750)
      rewardsPoolFirstPoolBalance.should.be.bignumber.equal(0)
      rewardsPoolSecondPoolBalance.should.be.bignumber.equal(750)
    })

    it.only('should transfer tokens to first pool and partially to caller if withdrawRewards 2', async() => {
      await tusd.transfer(rewardCollector.address, 1000, { from: fund })
      await advanceToBlock(epoch2 + 1)
      await rewardPools.withdrawRewards({ from: wallet })

      await tusd.transfer(rewardCollector.address, 1000, { from: fund })
      await advanceToBlock(epoch3 + 1)
      await rewardPools.withdrawRewards({ from: wallet })

      let walletTUSDBalance = await tusd.balanceOf(wallet)
      let rewardsPoolContractTUSDBalance = await tusd.balanceOf(rewardPools.address)
      let rewardsPoolFirstPoolBalance = await rewardPools.balanceOfPool.call(0, tusd.address)
      let rewardsPoolSecondPoolBalance = await rewardPools.balanceOfPool.call(1, tusd.address)
      let rewardsPoolThirdPoolBalance = await rewardPools.balanceOfPool.call(2, tusd.address)

      walletTUSDBalance.should.be.bignumber.equal(500)
      rewardsPoolContractTUSDBalance.should.be.bignumber.equal(1500)
      rewardsPoolFirstPoolBalance.should.be.bignumber.equal(0)
      rewardsPoolSecondPoolBalance.should.be.bignumber.equal(750)
      rewardsPoolThirdPoolBalance.should.be.bignumber.equal(750)
    })

    // it('should transfer tokens to first pool and partially to caller if withdrawRewards', async() => {
    //   await tusd.transfer(rewardCollector.address, 1000, { from: fund })
    //   await advanceToBlock(epoch2)
    //   await rewardPools.withdrawRewards({ from: wallet })

    //   await tusd.transfer(rewardCollector.address, 1000, { from: fund })
    //   await advanceToBlock(epoch3)
    //   await rewardPools.withdrawRewards({ from: wallet })

    //   let walletTUSDBalance = await tusd.balanceOf(wallet)
    //   let rewardsPoolContractTUSDBalance = await tusd.balanceOf(rewardPools.address)
    //   let rewardsPoolFirstPoolBalance = await rewardPools.balanceOfPool.call(0, tusd.address)
    //   let rewardsPoolSecondPoolBalance = await rewardPools.balanceOfPool.call(1, tusd.address)
    //   let rewardsPoolThirdPoolBalance = await rewardPools.balanceOfPool.call(2, tusd.address)

    //   console.log(walletTUSDBalance)
    //   console.log(rewardsPoolContractTUSDBalance)
    //   console.log(rewardsPoolFirstPoolBalance)
    //   console.log(rewardsPoolSecondPoolBalance)
    //   console.log(rewardsPoolThirdPoolBalance)

    //   walletTUSDBalance.should.be.bignumber.equal(500)
    //   rewardsPoolContractTUSDBalance.should.be.bignumber.equal(1500)
    //   rewardsPoolFirstPoolBalance.should.be.bignumber.equal(0)
    //   rewardsPoolSecondPoolBalance.should.be.bignumber.equal(750)
    //   rewardsPoolThirdPoolBalance.should.be.bignumber.equal(750)
    // })
  })

//     it('should transfer tokens to first pool and caller if withdrawRewards is called during the second epoch', async() => {
//       await tusd.transfer(rewardCollector.address, 1000, { from: fund })

//       await advanceToBlock(epoch1)

//       await tusd.transfer(rewardCollector.address, 1000, { from: fund })

//       await advanceToBlock(epoch2)

//       await tusd.transfer(rewardCollector.address, 1000, { from: fund })

//       await rewardPools.withdrawRewards({ from: wallet })

//       await advanceToBlock(epoch3)

//       await rewardPools.withdrawRewards({ from: wallet })

//       console.log(asdfadsfadsf)

//       let walletTUSDBalance = await tusd.balanceOf(wallet)
//       let rewardCollectorBalance = await tusd.balanceOf(rewardCollector.address)
//       let rewardsPoolContractTUSDBalance = await tusd.balanceOf(rewardPools.address)
//       let rewardsPoolFirstPoolBalance = await rewardPools.balanceOfPool.call(0, tusd.address)
//       let rewardsPoolSecondPoolBalance = await rewardPools.balanceOfPool.call(1, tusd.address)
//       let rewardsPoolThirdPoolBalance = await rewardPools.balanceOfPool.call(2, tusd.address)

//       console.log(walletTUSDBalance)
//       console.log(rewardCollectorBalance)
//       console.log(rewardsPoolContractTUSDBalance)
//       console.log(rewardsPoolFirstPoolBalance)
//       console.log(rewardsPoolSecondPoolBalance)
//       console.log(rewardsPoolThirdPoolBalance)

//       walletTUSDBalance.should.be.bignumber.equal(250)
//       rewardsPoolContractTUSDBalance.should.be.bignumber.equal(750)
//       rewardsPoolFirstPoolBalance.should.be.bignumber.equal(750)
//     })
//   })
// })

//   describe('Epochs', async() => {
//     beforeEach(async() => {
//       // We mint 1000 tokens and transfer half of them to the testing wallet address
//       proofToken = await ProofToken.new()
//       await proofToken.mint(fund, 1000)
//       await proofToken.transfer(wallet, 500, { from: fund })

//       // We deploy the rest of the contracts. The Proof tokens are already allocated before the first epoch
//       store = await Store.new()
//       cryptoDollar = await CryptoDollar.new(store.address)
//       rewards = await Rewards.new(store.address, proofToken.address)
//       cryptoFiatHub = await CryptoFiatHub.new(cryptoDollar.address, store.address, proofToken.address, rewards.address)

//       await Promise.all([
//         store.authorizeAccess(cryptoFiatHub.address),
//         store.authorizeAccess(cryptoDollar.address),
//         store.authorizeAccess(rewards.address),
//         cryptoDollar.authorizeAccess(cryptoFiatHub.address),
//         cryptoFiatHub.initialize(blocksPerEpoch, '', 0x0)
//       ])

//       creationBlockNumber = await cryptoFiatStorageProxy.getCreationBlockNumber(store.address)
//       epoch1 = creationBlockNumber.plus(blocksPerEpoch).toNumber()
//       epoch2 = creationBlockNumber.plus(2 * blocksPerEpoch).toNumber()
//     })

//     it('should update the current pool balance when receiving rewards', async() => {
//       await rewards.receiveRewards(defaultReward)
//       let currentPoolBalance = await rewards.getCurrentPoolBalance()
//       currentPoolBalance.should.be.bignumber.equal(1 * ether)
//     })

//     it('should throw an invalid opcode if calling receiveRewards() with an null value', async () => {
//       let emptyTx = { from: fund, value: 0 * ether }
//       await expectRevert(rewards.receiveRewards(emptyTx))
//     })

//     it('should get the current epoch', async() => {
//       let currentBlockNumber = web3.eth.blockNumber
//       let epoch = await rewards.getCurrentEpoch()
//       let expectedEpoch = computeEpoch(currentBlockNumber, creationBlockNumber, blocksPerEpoch)
//       epoch.should.be.bignumber.equal(expectedEpoch)
//     })

//     it('receiveRewards() should update the epoch', async() => {
//       let initialEpoch = await rewards.getCurrentEpoch()

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1)
//       // We call the receive dividends function again to trigger the update epoch modifier
//       await rewards.receiveRewards(defaultReward)

//       let epoch = await rewards.getCurrentEpoch()
//       epoch.should.be.bignumber.equal(initialEpoch.add(1))

//       let poolBalance = await rewards.getCurrentPoolBalance()
//       poolBalance.should.be.bignumber.equal(1 * ether)
//       let previousPoolBalance = await rewards.getNthPoolBalance(initialEpoch)
//       previousPoolBalance.should.be.bignumber.equal(1 * ether)
//     })

//     it('receiveRewards() should set the current pool balance to 0 if the epoch is updated', async() => {
//       let initialEpoch = await rewards.getCurrentEpoch()

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1) // We call the receive dividends function again to trigger the epoch udpate
//       await rewards.receiveRewards(defaultReward)

//       let poolBalance = await rewards.getCurrentPoolBalance()
//       poolBalance.should.be.bignumber.equal(1 * ether)
//       let previousPoolBalance = await rewards.getNthPoolBalance(initialEpoch)
//       previousPoolBalance.should.be.bignumber.equal(1 * ether)
//     })

//     it('getBlockNumberAtEpochStart() should return the blocknumber corresponding to an epoch start', async() => {
//       let blockNumber

//       // We test the functions for 2 blocks within the second epoch
//       let epochIndex = 2
//       let block1 = Math.round(epoch2 + blocksPerEpoch / 4)
//       let block2 = Math.round(epoch2 + blocksPerEpoch * 3 / 4)

//       await advanceToBlock(block1)
//       blockNumber = await rewards.getBlockNumberAtEpochStart(epochIndex)
//       blockNumber.should.be.bignumber.equals(epoch2)

//       await advanceToBlock(block2)
//       blockNumber = await rewards.getBlockNumberAtEpochStart(epochIndex)
//       blockNumber.should.be.bignumber.equals(epoch2)
//     })
//   })

//   describe('Withdraw rewards', async() => {
//     beforeEach(async() => {
//       // We mint 1000 tokens and transfer half of them to the testing wallet address
//       proofToken = await ProofToken.new()
//       await proofToken.mint(fund, 1000)
//       await proofToken.transfer(wallet, 500, { from: fund })

//       // We deploy the rest of the contracts. The Proof tokens are already allocated before the first epoch
//       store = await Store.new()
//       cryptoDollar = await CryptoDollar.new(store.address)
//       rewards = await Rewards.new(store.address, proofToken.address)
//       cryptoFiatHub = await CryptoFiatHub.new(cryptoDollar.address, store.address, proofToken.address, rewards.address)

//       await Promise.all([
//         store.authorizeAccess(cryptoFiatHub.address),
//         store.authorizeAccess(cryptoDollar.address),
//         store.authorizeAccess(rewards.address),
//         cryptoDollar.authorizeAccess(cryptoFiatHub.address),
//         cryptoFiatHub.initialize(blocksPerEpoch, '', 0x0)
//       ])

//       creationBlockNumber = await cryptoFiatStorageProxy.getCreationBlockNumber(store.address)
//       epoch1 = creationBlockNumber.plus(blocksPerEpoch).toNumber()
//       epoch2 = creationBlockNumber.plus(2 * blocksPerEpoch).toNumber()
//       epoch3 = creationBlockNumber.plus(3 * blocksPerEpoch).toNumber()
//     })

//     it('withdrawRewards() should throw if the caller already withdraw dividends during this epoch', async() => {
//       await expectRevert(rewards.withdrawRewards({ from: wallet }))
//     })

//     it('withdrawRewards() should return half of the dividends corresponding to the previous epoch pool', async() => {
//       let txn, txnFee
//       let initialBalance = web3.eth.getBalance(wallet)

//       // dividends are sent during the first epoch (epoch 0)
//       txn = await rewards.receiveRewards(defaultReward)

//       // advance to second epoch (epoch 1)
//       await advanceToBlock(epoch1)

//       // rewards are withdrawn during the second epoch (epoch 1). The rewards corresponding to epoch 0 are sent.
//       txn = await rewards.withdrawRewards(defaultParams)
//       txnFee = defaultParams.gasPrice * txn.receipt.gasUsed

//       let balance = web3.eth.getBalance(wallet)
//       let balanceIncrement = balance.minus(initialBalance)

//       // the testing address is entitled to 50% of dividends for epoch 0.
//       // epoch 1 is not over yet, so no dividends corresponding to this epoch
//       let expectedPayment = new web3.BigNumber(0.5 * ether)
//       let expectedBalanceIncrement = expectedPayment.minus(txnFee)
//       balanceIncrement.should.be.bignumber.equal(expectedBalanceIncrement)
//     })

//     it('withdrawRewards() should return correct amount of dividends for the 2 previous epochs', async() => {
//       let txn
//       let txnFee1, txnFee2
//       let initialBalance = web3.eth.getBalance(wallet)

//       // dividends are sent during the first epoch (epoch 0)
//       txn = await rewards.receiveRewards(defaultReward)

//       // 250 tokens are sent out of the wallet during the first epoch (epoch 0). There are 250 remaining tokens
//       txn = await proofToken.transfer(fund, 250, defaultParams)
//       txnFee1 = defaultParams.gasPrice * txn.receipt.gasUsed

//       // advance to second epoch (epoch 1)
//       await advanceToBlock(epoch1)

//       // rewards are sent to the reward pool during the second epoch (epoch 1)
//       txn = await rewards.receiveRewards(defaultReward)

//       // advance to third epoch (epoch 2)
//       await advanceToBlock(epoch2)

//       // rewards are withdraw during the third epoch (epoch 2). The rewards corresponding to the epochs 0 and 1 are sent
//       txn = await rewards.withdrawRewards(defaultParams)
//       txnFee2 = defaultParams.gasPrice * txn.receipt.gasUsed

//       // epoch 0: the testing address is entitled to 50% of dividends
//       // epoch 1: the testing address is entitled to 25% of dividends (~= 0.75 ether)
//       let balance = web3.eth.getBalance(wallet)
//       let balanceIncrement = balance.minus(initialBalance)
//       let expectedPayment = new web3.BigNumber(0.75 * ether)
//       let expectedBalanceIncrement = expectedPayment.minus(txnFee1).minus(txnFee2)
//       balanceIncrement.should.be.bignumber.equal(expectedBalanceIncrement)
//     })

//     it('withdrawRewards() should fail if the withdrawal value is 0', async() => {
//       // dividends are sent during epoch0
//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1)
//       // rewards are withdrawn during epoch1. The rewards corresponding to epoch 0 are sent.
//       await rewards.withdrawRewards(defaultParams)
//       await advanceToBlock(epoch2)
//       // attempt to withdraw with withdrawal value = 0 which should revert
//       await expectRevert(rewards.withdrawRewards(defaultParams))
//     })

//     it('withdrawRewards() should not reward a sender if tokens where withdraw before epoch start', async () => {
//       // wallet1 transfers remaining tokens to wallet2 before the start of epoch 1
//       await proofToken.transfer(wallet2, 500, defaultParams)
//       await advanceToBlock(epoch1)
//       await rewards.receiveRewards(defaultReward)

//       await advanceToBlock(epoch2)
//       await advanceToBlock(epoch3)

//       await expectRevert(rewards.withdrawRewards(defaultParams))
//     })

//     it('withdrawRewards() should add rewards for each epoch', async () => {
//       let initialBalance = web3.eth.getBalance(wallet)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch2)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch3)

//       let txn = await rewards.withdrawRewards(defaultParams)
//       let txnFee = defaultParams.gasPrice * txn.receipt.gasUsed
//       let balance = web3.eth.getBalance(wallet)
//       let expectedBalanceIncrement = 3 * (defaultReward.value / 2) - txnFee
//       let balanceIncrement = balance.minus(initialBalance)

//       balanceIncrement.should.be.bignumber.equal(expectedBalanceIncrement)
//     })

//     it('withdrawRewards() should send rewards receive during previous epochs', async () => {
//       let initialBalance = web3.eth.getBalance(wallet)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1)
//       await advanceToBlock(epoch2)
//       await advanceToBlock(epoch3)

//       let txn = await rewards.withdrawRewards(defaultParams)
//       let txnFee = defaultParams.gasPrice * txn.receipt.gasUsed
//       let balance = web3.eth.getBalance(wallet)

//       let expectedBalanceIncrement = (defaultReward.value / 2) - txnFee
//       let balanceIncrement = balance.minus(initialBalance)
//       balanceIncrement.should.be.bignumber.equal(expectedBalanceIncrement)
//     })

//     it('withdrawRewards() should give correct result when called several times', async () => {
//       let initialBalance = web3.eth.getBalance(wallet)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1)

//       let txn1 = await rewards.withdrawRewards(defaultParams)
//       let txn1Fee = defaultParams.gasPrice * txn1.receipt.gasUsed
//       let balance1 = web3.eth.getBalance(wallet)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch2)

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch3)

//       let txn2 = await rewards.withdrawRewards(defaultParams)
//       let txn2Fee = defaultParams.gasPrice * txn2.receipt.gasUsed
//       let balance2 = web3.eth.getBalance(wallet)

//       let expectedIncrement1 = (defaultReward.value / 2) - txn1Fee
//       let balanceIncrement1 = balance1.minus(initialBalance)

//       let expectedIncrement2 = (3 * defaultReward.value / 2) - txn1Fee - txn2Fee
//       let balanceIncrement2 = balance2.minus(initialBalance)

//       balanceIncrement1.should.be.bignumber.equal(expectedIncrement1)
//       balanceIncrement2.should.be.bignumber.equal(expectedIncrement2)
//     })
//   })

//   describe('Withdraw rewards', async() => {
//     beforeEach(async() => {
//       // We mint 1000 tokens and transfer half of them to the testing wallet address
//       proofToken = await ProofToken.new()
//       await proofToken.mint(fund, 1000)
//       await proofToken.transfer(wallet, 250, { from: fund })
//       await proofToken.transfer(wallet2, 250, { from: fund })
//       await proofToken.transfer(wallet3, 250, { from: fund })
//       await proofToken.transfer(wallet4, 250, { from: fund })

//       // We deploy the rest of the contracts. The Proof tokens are already allocated before the first epoch
//       store = await Store.new()
//       cryptoDollar = await CryptoDollar.new(store.address)
//       rewards = await Rewards.new(store.address, proofToken.address)
//       cryptoFiatHub = await CryptoFiatHub.new(cryptoDollar.address, store.address, proofToken.address, rewards.address)

//       await Promise.all([
//         store.authorizeAccess(cryptoFiatHub.address),
//         store.authorizeAccess(cryptoDollar.address),
//         store.authorizeAccess(rewards.address),
//         cryptoDollar.authorizeAccess(cryptoFiatHub.address),
//         cryptoFiatHub.initialize(blocksPerEpoch, '', 0x0)
//       ])

//       creationBlockNumber = await cryptoFiatStorageProxy.getCreationBlockNumber(store.address)
//       epoch1 = creationBlockNumber.plus(blocksPerEpoch).toNumber()
//       epoch2 = creationBlockNumber.plus(2 * blocksPerEpoch).toNumber()
//       epoch3 = creationBlockNumber.plus(3 * blocksPerEpoch).toNumber()
//     })

//     it('withdrawRewards() should give correct result when called several times', async () => {
//       let wallets = [wallet, wallet2, wallet3]
//       let initialBalances = wallets.map((wallet) => { return web3.eth.getBalance(wallet) })
//       let txnParams = wallets.map((wallet) => { return { from: wallet, gasPrice: defaultGasPrice } })
//       let txns = [[], [], []]
//       let balances = [[], [], []]
//       let txnsFee = [[], [], []]
//       let expectedIncrement = [[], [], []]
//       let balanceIncrement = [[], [], []]

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch1)

//       txns[0][0] = await rewards.withdrawRewards(txnParams[0])
//       balances[0][0] = web3.eth.getBalance(wallet)
//       txnsFee[0][0] = txnParams[0].gasPrice * txns[0][0].receipt.gasUsed

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch2)

//       txns[0][1] = await rewards.withdrawRewards(txnParams[0])
//       balances[0][1] = web3.eth.getBalance(wallet)
//       txnsFee[0][1] = txnParams[0].gasPrice * txns[0][1].receipt.gasUsed

//       txns[1][1] = await rewards.withdrawRewards(txnParams[1])
//       balances[1][1] = web3.eth.getBalance(wallet2)
//       txnsFee[1][1] = txnParams[1].gasPrice * txns[1][1].receipt.gasUsed

//       await rewards.receiveRewards(defaultReward)
//       await advanceToBlock(epoch3)

//       txns[0][2] = await rewards.withdrawRewards(txnParams[0])
//       balances[0][2] = web3.eth.getBalance(wallet)
//       txnsFee[0][2] = txnParams[0].gasPrice * txns[0][2].receipt.gasUsed

//       txns[1][2] = await rewards.withdrawRewards(txnParams[1])
//       balances[1][2] = web3.eth.getBalance(wallet2)
//       txnsFee[1][2] = txnParams[1].gasPrice * txns[1][2].receipt.gasUsed

//       txns[2][2] = await rewards.withdrawRewards(txnParams[2])
//       balances[2][2] = web3.eth.getBalance(wallet3)
//       txnsFee[2][2] = txnParams[2].gasPrice * txns[2][2].receipt.gasUsed

//       expectedIncrement[0][0] = (defaultReward.value / 4) - txnsFee[0][0]
//       balanceIncrement[0][0] = balances[0][0].minus(initialBalances[0])

//       expectedIncrement[0][1] = 2 * (defaultReward.value / 4) - txnsFee[0][1] - txnsFee[0][0]
//       balanceIncrement[0][1] = balances[0][1].minus(initialBalances[0])

//       expectedIncrement[1][1] = 2 * (defaultReward.value / 4) - txnsFee[1][1]
//       balanceIncrement[1][1] = balances[1][1].minus(initialBalances[1])

//       expectedIncrement[0][2] = 3 * (defaultReward.value / 4) - txnsFee[0][2] - txnsFee[0][1] - txnsFee[0][0]
//       balanceIncrement[0][2] = balances[0][2].minus(initialBalances[0])

//       expectedIncrement[1][2] = 3 * (defaultReward.value / 4) - txnsFee[1][2] - txnsFee[1][1]
//       balanceIncrement[1][2] = balances[1][2].minus(initialBalances[1])

//       expectedIncrement[2][2] = 3 * (defaultReward.value / 4) - txnsFee[2][2]
//       balanceIncrement[2][2] = balances[2][2].minus(initialBalances[2])

//       for (let epochIndex = 0; epochIndex < 3; epochIndex++) {
//         for (let walletIndex = 0; walletIndex <= epochIndex; walletIndex++) {
//           balanceIncrement[walletIndex][epochIndex].should.be.bignumber.equal(expectedIncrement[walletIndex][epochIndex])
//         }
//       }
//     })
//   })
})
