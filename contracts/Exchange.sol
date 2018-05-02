pragma solidity ^0.4.19;
// pragma experimental ABIEncoderV2;

import './utils/SafeMath.sol';
import './utils/Owned.sol';
import './interfaces/ERC20.sol';

contract Exchange is Owned
{
  using SafeMath for uint256;

  event LogTrade(address tokenBuy, address tokenSell, address maker, address taker, uint256 amount, bytes32 hsh);
  event LogDeposit(address token, address user, uint256 amount, uint256 balance);
  event LogWithdraw(address token, address user, uint256 amount, uint256 balance);
  event LogSecurityWithdraw(address token, address user, uint256 amount, uint256 balance);
  event LogTransfer(address token, address recipient);

  event LogCancelOrder(
    address tokenBuy,
    uint256 amountBuy,
    address tokenSell,
    uint256 amountSell,
    uint256 expires,
    uint256 nonce,
    address maker,
    uint8 v,
    bytes32 r,
    bytes32 s
  );

  enum Errors
  {
    MAKER_INSUFFICIENT_BALANCE,
    TAKER_INSUFFICIENT_BALANCE,
    WITHDRAW_INSUFFICIENT_BALANCE,
    WITHDRAW_FEE_TO_HIGH,
    ORDER_EXPIRED,
    WITHDRAW_ALREADY_COMPLETED,
    TRADE_ALREADY_COMPLETED,
    TRADE_AMOUNT_TOO_BIG,
    SIGNATURE_INVALID,
    MAKER_SIGNATURE_INVALID,
    TAKER_SIGNATURE_INVALID
  }

  event LogError(
    uint8  errorId,
    bytes32  orderHash
  );


  address public feeAccount;
  uint256 public withdrawalSecurityPeriod;
  mapping (bytes32 => bool) public traded;
  mapping (bytes32 => bool) public withdrawn;
  mapping (bytes32 => bool) public transferred;
  mapping (address => bool) public operators;
  mapping (address => uint256) public lastTransaction;
  mapping (bytes32 => uint256) public orderFills;
  mapping (address => mapping (address => uint256)) public tokens;
  mapping (address => uint256) public protectedFunds;

  struct Order
  {
    uint256 amountBuy;
    uint256 amountSell;
    uint256 expires;
    uint256 nonce;
    uint256 feeMake;
    uint256 feeTake;
    address tokenBuy;
    address tokenSell;
    address maker;
  }

  struct Trade
  {
    uint256 amount;
    uint256 tradeNonce;
    address taker;
  }

  function Exchange(address _feeAccount) public
  {
    feeAccount = _feeAccount;
  }

  function setFeeAccount(address _feeAccount) public onlyOperator returns (bool)
  {
    feeAccount = _feeAccount;
    return true;
  }

  function setOperator(address operator, bool isOperator) public onlyOwner returns (bool)
  {
    operators[operator] = isOperator;
    return true;
  }

  modifier onlyOperator
  {
    require(msg.sender == owner || operators[msg.sender]);
    _;
  }

  function setWithdrawalSecurityPeriod(uint256 _withdrawalSecurityPeriod) public onlyOperator returns (bool)
  {
    withdrawalSecurityPeriod = _withdrawalSecurityPeriod;
    return true;
  }

  modifier canWithdraw(address user)
  {
    require(block.number.sub(lastTransaction[user]) >= withdrawalSecurityPeriod);
    _;
  }

  function depositEther() public payable returns (bool)
  {
    require(msg.value > 0);
    deposit(0x0, msg.value);
    return true;
  }

  function depositToken(address token, uint256 amount) public returns (bool)
  {
    require(token != address(0) && amount > 0);
    deposit(token, amount);
    ERC20(token).transferFrom(msg.sender, this, amount);
    return true;
  }

  function deposit(address token, uint256 amount) internal returns (bool)
  {
    tokens[token][msg.sender] = tokens[token][msg.sender].add(amount);
    lastTransaction[msg.sender] = block.number;
    LogDeposit(token, msg.sender, amount, tokens[token][msg.sender]);
    return true;
  }

  function tokenBalance(address trader, address token) constant returns (uint256)
  {
    return tokens[token][trader];
  }

  function etherBalance(address trader) constant returns (uint256)
  {
    return tokens[0x0][trader];
  }

  function securityWithdraw(address token, uint256 amount) public canWithdraw(msg.sender) returns (bool)
  {
    address trader = msg.sender;
    require(tokens[token][trader] >= amount);
    tokens[token][trader] = tokens[token][trader].sub(amount);

    if (token == address(0))
    {
      require(trader.send(amount));
    }
    else
    {
      require(ERC20(token).transfer(trader, amount));
    }

    LogSecurityWithdraw(token, trader, amount, tokens[token][trader]);
    return true;
  }

  function withdraw(
    address token,
    uint256 amount,
    address trader,
    address receiver,
    uint256 nonce,
    uint8 v,
    bytes32[2] rs,
    uint256 feeWithdrawal) public onlyOperator returns (bool)
  {

    bytes32 orderHash = keccak256(this, token, amount, trader, receiver, nonce);
    if (!validateWithdrawal(orderHash, token, amount, trader, receiver, v, rs, feeWithdrawal))
    {
      return false;
    }


    uint256 fee = feeWithdrawal.mul(amount) / 1 ether;
    tokens[token][trader] = tokens[token][trader].sub(amount);
    tokens[token][feeAccount] = tokens[token][feeAccount].add(fee);
    amount = amount.sub(fee);
    uint256 tokenAmount = tokens[token][trader];

    if (token == address(0))
    {
      receiver.transfer(amount);
    }
    else
    {
      ERC20(token).transfer(receiver, amount);
    }

    withdrawn[orderHash] = true;
    lastTransaction[trader] = block.number;
    LogWithdraw(token, trader, amount, tokenAmount);
    return true;
  }




  function validateWithdrawal(
    bytes32 orderHash,
    address token,
    uint256 amount,
    address trader,
    address receiver,
    uint8 v,
    bytes32[2] rs,
    uint256 feeWithdrawal
  ) internal returns (bool)
  {

    if (!isValidSignature(trader, orderHash, v, rs[0], rs[1]))
    {
      LogError(uint8(Errors.SIGNATURE_INVALID), orderHash);
      return false;
    }

    if (withdrawn[orderHash])
    {
      LogError(uint8(Errors.WITHDRAW_ALREADY_COMPLETED), orderHash);
      return false;
    }

    if (tokens[token][trader] < amount)
    {
      LogError(uint8(Errors.WITHDRAW_INSUFFICIENT_BALANCE), bytes32(tokens[token][trader]));
      return false;
    }

    if (feeWithdrawal > amount)
    {
      LogError(uint8(Errors.WITHDRAW_FEE_TO_HIGH), bytes32(feeWithdrawal));
      return false;
    }


    return true;
  }

  /**
   amountBuy is the amount of buy tokens asked in the trade
   amountSell is the amount of sell tokens offered in the trade
   expires is the expiration time after which tokens the trade can no longer be completed
   nonce
   amount is the amount of buy tokens offered by the taker. In other words amount/amountBuy is the fraction of the initial trade to be carried out
   tradeNonce
   feeMake is the maker fee
   feeTake is the taker fee
   tokenBuy is the ethereum address of the buy token
   tokenSell is the ethereum address of the sell token
   maker is the ethereum address of the maker
   taker is the ethereum address of the taker
   v[0], rs[0], rs[1] are respectively v, r, s of the maker's signature
   v[1], rs[2], rs[3] are respectively v, r, s of the taker's signature
   */
  // function trade(
  //   uint256 amountBuy,
  //   uint256 amountSell,
  //   uint256 expires,
  //   uint256 nonce,
  //   uint256 amount,
  //   uint256 tradeNonce,
  //   uint256 feeMake,
  //   uint256 feeTake,
  //   address tokenBuy,
  //   address tokenSell,
  //   address maker,
  //   address taker,
  //   uint8[2]v,
  //   bytes32[4] rs
  // ) public onlyOperator returns (bool)
  function executeTrade(
    uint256[8] orderValues,
    address[4] orderAddresses,
    uint8[2] memory v,
    bytes32[4] memory rs
  ) public onlyOperator returns (bool)
  {
    Order memory order = Order({
      amountBuy: orderValues[0],
      amountSell: orderValues[1],
      expires: orderValues[2],
      nonce: orderValues[3],
      feeMake: orderValues[4],
      feeTake: orderValues[5],
      tokenBuy: orderAddresses[0],
      tokenSell: orderAddresses[1],
      maker: orderAddresses[2]
    });

    Trade memory trade = Trade({
      amount: orderValues[6],
      tradeNonce: orderValues[7],
      taker: orderAddresses[3]
    });

    bytes32 orderHash = keccak256(this, order.tokenBuy, order.amountBuy, order.tokenSell, order.amountSell, order.expires, order.nonce, order.maker);
    bytes32 tradeHash = keccak256(orderHash, trade.amount, trade.taker, trade.tradeNonce);

    if (!isValidSignature(order.maker, orderHash, v[0] , rs[0], rs[1]))
    {
      LogError(uint8(Errors.MAKER_SIGNATURE_INVALID), orderHash);
      return false;
    }

    if (!isValidSignature(trade.taker, tradeHash, v[1] ,rs[2], rs[3]))
    {
      LogError(uint8(Errors.TAKER_SIGNATURE_INVALID), tradeHash);
      return false;
    }

    if (order.expires < block.number) {
      LogError(uint8(Errors.ORDER_EXPIRED), orderHash);
      return false;
    }

    if (tokens[order.tokenBuy][trade.taker] < trade.amount)
    {
      LogError(uint8(Errors.TAKER_INSUFFICIENT_BALANCE), tradeHash);
      return false;
    }

    if (tokens[order.tokenSell][order.maker] < order.amountSell.mul(trade.amount).div(order.amountBuy))
    {
      LogError(uint8(Errors.MAKER_INSUFFICIENT_BALANCE), tradeHash);
      return false;
    }

    if (traded[tradeHash])
    {
      LogError(uint8(Errors.TRADE_ALREADY_COMPLETED), tradeHash);
      return false;
    }

    if (orderFills[orderHash].add(trade.amount) > order.amountBuy)
    {
      LogError(uint8(Errors.TRADE_AMOUNT_TOO_BIG), tradeHash);
      return false;
    }

    traded[tradeHash] = true;

    uint256 makerFee = trade.amount.mul(order.feeMake) / 1 ether;
    uint256 amountSellAdjusted = order.amountSell.mul(trade.amount).div(order.amountBuy);
    uint256 takerFee = order.feeTake.mul(amountSellAdjusted) / 1 ether;

    tokens[order.tokenBuy][order.maker] = tokens[order.tokenBuy][order.maker].add(trade.amount - makerFee);
    tokens[order.tokenBuy][trade.taker] = tokens[order.tokenBuy][trade.taker].sub(trade.amount);
    tokens[order.tokenBuy][feeAccount] = tokens[order.tokenBuy][feeAccount].add(makerFee);

    tokens[order.tokenSell][order.maker] = tokens[order.tokenSell][order.maker].sub(order.amountSell.mul(trade.amount).div(order.amountBuy));
    tokens[order.tokenSell][trade.taker] = tokens[order.tokenSell][trade.taker].add(amountSellAdjusted.sub(takerFee));
    tokens[order.tokenSell][feeAccount] = tokens[order.tokenSell][feeAccount].add(takerFee);
    orderFills[orderHash] = orderFills[orderHash].add(trade.amount);

    lastTransaction[order.maker] = block.number;
    lastTransaction[trade.taker] = block.number;
    LogTrade(order.tokenBuy, order.tokenSell, order.maker, trade.taker, trade.amount, orderHash);
    return true;
  }

  // function cancelOrder(address tokenBuy, uint256 amountBuy, address tokenSell, uint256 amountSell, uint256 expires, uint256 nonce, uint8 v, bytes32 r, bytes32 s, address maker) {
  //   bytes orderHash = keccak256(tokenBuy, amountBuy, tokenSell, amountSell, expires, nonce, maker)
  //   require(ecrecover(keccak256("x19Ethereum Signed Message:\32", orderHash), v, r, s) == msg.sender);
  //   orderFills[orderHash] = amountBuy;
  //   LogCancelOrder(tokenBuy, amountBuy, tokenSell, amountSell, expires, nonce, msg.sender, v, r, s);
  //   }
  // }

    function isValidSignature(
      address signer,
      bytes32 hashedData,
      uint8 v,
      bytes32 r,
      bytes32 s
    ) public constant returns (bool)
    {
      return signer == ecrecover(
          keccak256("\x19Ethereum Signed Message:\n32", hashedData),
          v,
          r,
          s
      );
    }


  function() external
  {
    revert();
  }



}