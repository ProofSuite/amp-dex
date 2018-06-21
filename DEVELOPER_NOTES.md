## Architecture

The proof decentralized exchange is a hybrid decentralized exchange that aims at bringing together the ease of use of 
centralized exchanges along with the security and privacy features of decentralized exchanges. Orders are matched 
through the proof orderbook. After orders are matched, the decentralized exchange operator has the sole ability to 
perform a transaction to the smart contract.This provides for the best UX as the exchange operator is the only party 
having to interact directly with the blockchain. Exchange users simply sign orders which are broadcasted to the 
orderbook.This enables users to cancel their orders without having to perform a blockchain transaction and pay the 
associated gas fees.

## Overview of 'Exchange.sol'

It provides the facility to exchange ERC20 tokens. Quick glance at contract functions:

| Function            | Description                      |
| ------------------- | -------------------------------- |
| setWethToken        | Allows owner to set a given address as WETH token. WETH token are accepted as fees for executed trades.|
| setFeeAccount       | Allows owner to set a given address as fees account. All the fees received in executed trades will be deposited in this address.|
| setOperator         | Allows owner to set/unset a given address as exchange operator. Operator's have the ablity to access 'executeTrade' functions & settle orders.|
| executeTrade        | Allows owner/operator to settle matched order between a maker & taker on chain.|
| cancelOrder         | Allows maker to cancel an input order.|
| cancelTrade         | Allows taker to cancel an input trade.|
| isValidSignature    | Verifies whether a given input signature is valid or not.|
| isRoundingError     | Checks if rounding error is greater than 0.1% for given numerator, denominator & target. It is used to verify that the rounding error in the calulated makerTokenAmount for given tradeAmount, does not exceed 0.1%|
| getPartialAmount    | Calculates partial value for given numerator, denominator & target. It is used to calculate partial makerTokenAmount for a trade as well as partial maker & taker fees for a trade. |
| getOrderHash        | Calculates Keccak-256 hash of order.|
| getTradeHash        | Calculates Keccak-256 hash of trade.|

## Why 'Allowance' mechanism is used instead of 'Deposit/Withdraw' mechanism in the exchange?

### Deposit/Withdraw

In the deposit/withdraw mechanism, the user is required to deposit the token in the excahnge based on which he can carry out
the trade. If the user now wishes to cancel the trade & spend the deposited tokens for some other purpose, He would need to
create 3 transactions:
- "Cancel order" transaction.
- "Withdraw token" transaction.
- "Spend token" transaction.  

which will cause user to bear extra costs. 

### Allowance

In the allowance mechanism, if the user has enough token balance for the trade, he/she would not need to deposit tokens in
exchange but instead just approve the exchange with the amount ot tokens to spend in trade. If the user further wishes to 
cancel the trade & spend the & spend the deposited tokens for some other purpose, He would need to
create 2 transactions: 
- "Cancel order" transaction.
- "Spend token" transaction.  

which eliminates the extra costs of "withdraw token" transaction. The user does not need to reset the allowance as the exchange
can not be misuse it, as the exchange can spend allownce only for signed order by user that are not cancelled.

## Why only Owner/Operator can call 'executeTrade' in the smart contract & settle an order on-chain?

The exchange contract is designed such that only the operator or owner is authorized to submit signed trades to Ethereum.
This enables operator/exchange to control the order in which transactions are processed, separating the act of trading from
final settlement. 

As users trade their In-Order exchange balances are updated in real-time, while simultaneously their private keys are used to 
authorize the trade in the contract. This authorization prevents users from rescinding any completed trades, and prevents
exchange from initiating any unauthorized trades.

Exchange manages the queue of pending transactions, dispatching them in sequence to ensure that each trade is mined in the
correct order and that the smart contract balances stay in sync with the exchange balances. By controlling the transaction 
sequence, Exchange provides the speed and user experience of centralized exchanges combined with the security and 
auditability of decentralized exchanges.

##  Why the exchange uses W-ETH & not pure ETH as fees?

Decentralized platforms running on Ethereum use smart contracts to facilitate trades directly between users, every user needs
to have the same standardized format for every token they trade. Which ensures tokens don’t get lost in translation. ETH does 
not confirm to it's own ERC20 standard as it was built before the ERC20 standard existed. Thus by converting ETH to W-ETH 
enables users to trade ETH for other ERC20 tokens on decentralized platforms. 

The current implementation of W-ETH can be found at :
https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code

When you "wrap" ETH, you aren't really wrapping so much as trading via a smart contract for an equal token called W-ETH. 
If you want to get plain ETH back you need to "unwrap" it. AKA trade it back for plain ETH.

In order to pay fees for orders/trade in exchange they do not need to deposit any ETH in exchange, instead the user should hold 
the W-ETH fees amount & have to provide allowance to exchange just like they do for other tokens they trade, so that exchange 
can transfer the W-ETH fees amount to feesAccount when executing a trade.

Benifits of W-ETH :
- The source code for the proposed W-ETH contract has been thoroughly audited & contracts which have been both audited and held
significant value over a period of time, are considered to be safer.

- The W-ETH contract support for unlimited allowances, which means that user can provide allowance once to exchange & than can
trade as much as needed.

- Simplifies the Exchange contract as the 'executeTrade' does not need to conditionally manage transfer of ERC20 tokens &
ETH, Since ETH is replaced by W-ETH which follows ERC20 standard & can be managed similarly like other ERC20 token.
