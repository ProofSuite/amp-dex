/**
 * @description Fails if the input promise is not rejected with an Invalid opcode message
 * @param promise
 */
export const expectInvalidOpcode = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('invalid opcode')
    return
  }
  expect.fail('Expected throw not received')
}

/**
 * @description Fails if the input promise is not rejected with a Revert message
 * @param promise
 */
export const expectRevert = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('revert')
    return
  }
  expect.fail('Expected revert not received')
}

/**
 * @description Fails if the input promise is not reject with an Invalid jump message
 * @param promise
 */
export const expectInvalidJump = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('invalid JUMP')
    return
  }
  expect.fail('Expected throw not received')
}

/**
 * @description Fails if the input promise is not rejected with an Out of Gas message
 * @param promise
 */
export const expectOutOfGas = async (promise) => {
  try {
    await promise
  } catch (error) {
    expect(error.message).to.include('out of gas')
    return
  }
  expect.fail('Expected throw not received')
}

/**
 * @description Mine the local evm
 * @returns promise
 */
export const advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now(),
    }, (err, res) => {
      return err ? reject(err) : resolve(err)
    })
  })
}

/**
 * @description Advance to input block
 * @param {Number} number
 */
export const advanceToBlock = async(number) => {
  if (web3.eth.blockNumber > number) {
    throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`)
  }
  while (web3.eth.blockNumber < number) {
    await advanceBlock()
  }
}

export const advanceNBlocks = async(number) => {
  let initialBlockNumber = web3.eth.blockNumber
  if (number < 0) {
    throw Error(`number should be a strictly positive number`)
  }
  while(web3.eth.blockNumber < initialBlockNumber + number) {
    await advanceBlock()
  }
}