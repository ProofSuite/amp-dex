pragma solidity 0.4.24;

import './utils/SafeMath.sol';
import './utils/Owned.sol';
import './interfaces/ERC20.sol';

contract Exchange is Owned {
    using SafeMath for uint256;

    enum Errors {
        SIGNATURE_INVALID,                      // Signature is invalid
        MAKER_SIGNATURE_INVALID,                // Maker signature is invalid
        TAKER_SIGNATURE_INVALID,                // Taker signature is invalid
        ORDER_EXPIRED,                          // Order has already expired
        TRADE_ALREADY_COMPLETED_OR_CANCELLED,   // Trade has already been completed or it has been cancelled by taker
        TRADE_AMOUNT_TOO_BIG,                   // Trade buyToken amount bigger than the remianing amountBuy
        ROUNDING_ERROR_TOO_LARGE,               // Rounding error too large
        INSUFFICIENT_BALANCE_OR_ALLOWANCE       // Maker/Taker has insufficient balance or allowance for token transfer
    }

    string constant public VERSION = "1.0.0";

    address public WETH_TOKEN_CONTRACT;

    address public feeAccount;
    mapping(address => bool) public operators;
    mapping(bytes32 => uint) public filled;       // Mappings of orderHash => amount of amountBuy filled.
    mapping(bytes32 => bool) public traded;       // Mappings of tradeHash => bool value representing whether the trade is completed(true) or incomplete(false).

    event LogTrade(
        address indexed maker,
        address indexed taker,
        address tokenSell,
        address tokenBuy,
        uint256 filledAmountSell,
        uint256 filledAmountBuy,
        uint paidFeeMake,
        uint paidFeeTake,
        bytes32 orderHash,
        bytes32 indexed tokenPairHash // keccak256(makerToken, takerToken), allows subscribing to a token pair
    );

    event LogError(uint8 errorId, bytes32 orderHash);

    event LogCancelOrder(
        bytes32 orderHash,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        uint256 expires,
        uint256 nonce,
        address indexed maker,
        bytes32 indexed tokenPairHash // keccak256(makerToken, takerToken), allows subscribing to a token pair
    );

    event LogCancelTrade(
        bytes32 orderHash,
        uint256 amount,
        uint256 tradeNonce,
        address indexed taker
    );

    struct Order {
        uint256 amountBuy;  // The amount of buy tokens asked in the order
        uint256 amountSell; // The amount of sell tokens asked in the order
        uint256 expires;    // The block length after which the order will be considered expired
        uint256 nonce;      // A maker wise unique incrementing integer value assigned to the order
        uint256 feeMake;    // It is the maker fee
        uint256 feeTake;    // It is the taker fee
        address tokenBuy;   // Ethereum address of the buy token
        address tokenSell;  // Ethereum address of the sell token
        address maker;      // Ethereum address of the order maker
    }

    struct Trade {
        bytes32 orderHash;  // Keccak-256 hash of the order to which the trade is linked
        uint256 amount;     // The amount of buy tokens asked in the order
        uint256 tradeNonce; // A taker wise unique incrementing integer value assigned to the trade
        address taker;      // Ethereum address of the trade taker
    }

    modifier onlyOperator {
        require(msg.sender == owner || operators[msg.sender]);
        _;
    }

    constructor(address _wethToken, address _feeAccount) public {
        WETH_TOKEN_CONTRACT = _wethToken;
        feeAccount = _feeAccount;
    }

    /// @dev Sets the address of WETH token.
    /// @param _wethToken An address to set as WETH token address.
    /// @return Success on setting WETH token address.
    function setWethToken(address _wethToken) public onlyOwner returns (bool) {
        WETH_TOKEN_CONTRACT = _wethToken;
        return true;
    }

    /// @dev Sets the address of fees account.
    /// @param _feeAccount An address to set as fees account.
    /// @return Success on setting fees account.
    function setFeeAccount(address _feeAccount) public onlyOperator returns (bool) {
        feeAccount = _feeAccount;
        return true;
    }

    /// @dev Sets or unset's an operator.
    /// @param operator The address of operator to set.
    /// @param isOperator Bool value indicating whether the address is operator or not.
    /// @return Success on setting an operator.
    function setOperator(address operator, bool isOperator) public onlyOwner returns (bool) {
        operators[operator] = isOperator;
        return true;
    }


    /*
    * Core exchange functions
    */


    /// @dev Executes a trade between maker & taker.
    /// @param orderValues Array of order's amountBuy, amountSell, expires, nonce, feeMake & feeTake values.
    /// @param orderAddresses Array of order's tokenBuy, tokenSell, maker & taker addresses.
    /// @param v Array of maker's & taker's ECDSA signature parameter v for order & trade.
    ///         v[0] is v parameter of the maker's signature
    ///         v[1] is v parameter of the taker's signature
    /// @param rs Array of maker's & taker's ECDSA signature parameter r & s for order & trade.
    ///         rs[0] is r parameter of the maker's signature
    ///         rs[1] is s parameter of the maker's signature
    ///         rs[2] is r parameter of the taker's signature
    ///         rs[3] is s parameter of the taker's signature
    /// @return Success or failure of trade execution.
    function executeTrade(
        uint256[8] orderValues,
        address[4] orderAddresses,
        uint8[2] memory v,
        bytes32[4] memory rs
    ) public onlyOperator returns (bool)
    {
        Order memory order = Order({
            amountBuy : orderValues[0],
            amountSell : orderValues[1],
            expires : orderValues[2],
            nonce : orderValues[3],
            feeMake : orderValues[4],
            feeTake : orderValues[5],
            tokenBuy : orderAddresses[0],
            tokenSell : orderAddresses[1],
            maker : orderAddresses[2]
            });

        bytes32 orderHash = getOrderHash(order);

        Trade memory trade = Trade({
            orderHash : orderHash,
            amount : orderValues[6],
            tradeNonce : orderValues[7],
            taker : orderAddresses[3]
            });

        bytes32 tradeHash = getTradeHash(trade);

        if (!isValidSignature(order.maker, orderHash, v[0], rs[0], rs[1])) {
            emit LogError(uint8(Errors.MAKER_SIGNATURE_INVALID), orderHash);
            return false;
        }

        if (!isValidSignature(trade.taker, tradeHash, v[1], rs[2], rs[3])) {
            emit LogError(uint8(Errors.TAKER_SIGNATURE_INVALID), tradeHash);
            return false;
        }

        if (order.expires < block.number) {
            emit LogError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return false;
        }

        if (traded[tradeHash]) {
            emit LogError(uint8(Errors.TRADE_ALREADY_COMPLETED_OR_CANCELLED), tradeHash);
            return false;
        }

        if (filled[orderHash].add(trade.amount) > order.amountBuy) {
            emit LogError(uint8(Errors.TRADE_AMOUNT_TOO_BIG), orderHash);
            return false;
        }

        if (isRoundingError(trade.amount, order.amountBuy, order.amountSell)) {
            emit LogError(uint8(Errors.ROUNDING_ERROR_TOO_LARGE), orderHash);
            return false;
        }

        if (!isTransferable(order, trade)) {
            emit LogError(uint8(Errors.INSUFFICIENT_BALANCE_OR_ALLOWANCE), orderHash);
            return false;
        }

        traded[tradeHash] = true;
        uint filledAmountSell = getPartialAmount(trade.amount, order.amountBuy, order.amountSell);

        filled[orderHash] = filled[orderHash].add(trade.amount);

        require(ERC20(order.tokenSell).transferFrom(order.maker, trade.taker, filledAmountSell));
        require(ERC20(order.tokenBuy).transferFrom(trade.taker, order.maker, trade.amount));

        if (order.feeMake > 0) {
            uint paidFeeMake = getPartialAmount(trade.amount, order.amountBuy, order.feeMake);
            require(ERC20(WETH_TOKEN_CONTRACT).transferFrom(order.maker, feeAccount, paidFeeMake));
        }

        if (order.feeTake > 0) {
            uint paidFeeTake = getPartialAmount(trade.amount, order.amountBuy, order.feeTake);
            require(ERC20(WETH_TOKEN_CONTRACT).transferFrom(trade.taker, feeAccount, paidFeeTake));
        }

        emit LogTrade(
            order.maker,
            trade.taker,
            order.tokenSell,
            order.tokenBuy,
            filledAmountSell,
            trade.amount,
            paidFeeMake,
            paidFeeTake,
            orderHash,
            keccak256(abi.encodePacked(order.tokenSell, order.tokenBuy)));
        return true;
    }

    /// @dev Cancels the input order.
    /// @param orderValues Array of order's amountBuy, amountSell, expires, nonce, feeMake & feeTake values.
    /// @param orderAddresses Array of order's tokenBuy, tokenSell & maker addresses.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Success or failure of order cancellation.
    function cancelOrder(
        uint256[6] orderValues,
        address[3] orderAddresses,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (bool)
    {
        Order memory order = Order({
            amountBuy : orderValues[0],
            amountSell : orderValues[1],
            expires : orderValues[2],
            nonce : orderValues[3],
            feeMake : orderValues[4],
            feeTake : orderValues[5],
            tokenBuy : orderAddresses[0],
            tokenSell : orderAddresses[1],
            maker : orderAddresses[2]
            });

        bytes32 orderHash = getOrderHash(order);

        if (!isValidSignature(msg.sender, orderHash, v, r, s)) {
            emit LogError(uint8(Errors.SIGNATURE_INVALID), orderHash);
            return false;
        }
        filled[orderHash] = order.amountBuy;

        emit LogCancelOrder(
            orderHash,
            order.tokenBuy,
            order.amountBuy,
            order.tokenSell,
            order.amountSell,
            order.expires,
            order.nonce,
            order.maker,
            keccak256(abi.encodePacked(order.tokenSell, order.tokenBuy)));
        return true;
    }


    /// @dev Cancels the input trade.
    /// @param orderHash Keccak-256 hash of order.
    /// @param amount Desired amount of takerToken that was to be filled in trade.
    /// @param taker Address of the taker.
    /// @param tradeNonce Trade nonce that was used in the trade.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Success or failure of trade cancellation.
    function cancelTrade(
        bytes32 orderHash,
        uint256 amount,
        uint256 tradeNonce,
        address taker,
        uint8 v,
        bytes32 r,
        bytes32 s)
    public
    returns (bool)
    {
        Trade memory trade = Trade({
            orderHash : orderHash,
            amount : amount,
            tradeNonce : tradeNonce,
            taker : taker
            });

        bytes32 tradeHash = getTradeHash(trade);

        if (!isValidSignature(msg.sender, tradeHash, v, r, s)) {
            emit LogError(uint8(Errors.SIGNATURE_INVALID), tradeHash);
            return false;
        }
        traded[tradeHash] = true;

        emit LogCancelTrade(orderHash, amount, tradeNonce, taker);
        return true;
    }

    /*
    * Constant public functions
    */

    /// @dev Verifies that an order signature is valid.
    /// @param signer address of signer.
    /// @param hash Signed Keccak-256 hash.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Validity of order signature.
    function isValidSignature(
        address signer,
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s)
    public
    pure
    returns (bool)
    {
        return signer == ecrecover(
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)),
            v,
            r,
            s
        );
    }

    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(uint numerator, uint denominator, uint target)
    public
    pure
    returns (bool)
    {
        uint remainder = mulmod(target, numerator, denominator);
        if (remainder == 0) return false;
        // No rounding error.

        uint errPercentageTimes1000000 = (remainder.mul(1000000)).div(numerator.mul(target));
        return errPercentageTimes1000000 > 1000;
    }

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function getPartialAmount(uint numerator, uint denominator, uint target)
    public
    pure
    returns (uint)
    {
        return (numerator.mul(target)).div(denominator);
    }


    /*
    *   Internal functions
    */


    /// @dev Calculates Keccak-256 hash of order.
    /// @param order Order that will be hased.
    /// @return Keccak-256 hash of order.
    function getOrderHash(Order order)
    internal
    view
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(
                address(this),
                order.maker,
                order.tokenSell,
                order.tokenBuy,
                order.amountSell,
                order.amountBuy,
                order.feeMake,
                order.feeTake,
                order.expires,
                order.nonce
            ));
    }

    /// @dev Calculates Keccak-256 hash of trade.
    /// @param trade Trade that will be hashed.
    /// @return Keccak-256 hash of trade.
    function getTradeHash(Trade trade)
    internal
    pure
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(
                trade.orderHash,
                trade.taker,
                trade.amount,
                trade.tradeNonce
            ));
    }

    /// @dev Checks if any order transfers will fail.
    /// @param order Order struct of params that will be checked.
    /// @param trade Trade struct of params that will be checked.
    /// @return Predicted result of transfers.
    function isTransferable(Order order, Trade trade)
    internal
    view
    returns (bool)
    {
        address taker = trade.taker;
        uint amountBuyToFill = trade.amount;
        uint amountSellFilled = getPartialAmount(amountBuyToFill, order.amountBuy, order.amountSell);

        bool isMakerTokenWETH = order.tokenSell == WETH_TOKEN_CONTRACT;
        bool isTakerTokenWETH = order.tokenBuy == WETH_TOKEN_CONTRACT;
        uint paidMakerFee = getPartialAmount(amountBuyToFill, order.amountBuy, order.feeMake);
        uint paidTakerFee = getPartialAmount(amountBuyToFill, order.amountBuy, order.feeTake);
        uint requiredMakerWETH = isMakerTokenWETH ? amountSellFilled.add(paidMakerFee) : paidMakerFee;
        uint requiredTakerWETH = isTakerTokenWETH ? amountBuyToFill.add(paidTakerFee) : paidTakerFee;

        if (getBalance(WETH_TOKEN_CONTRACT, order.maker) < requiredMakerWETH
        || getAllowance(WETH_TOKEN_CONTRACT, order.maker) < requiredMakerWETH
        || getBalance(WETH_TOKEN_CONTRACT, taker) < requiredTakerWETH
        || getAllowance(WETH_TOKEN_CONTRACT, taker) < requiredTakerWETH
        ) return false;

        if (!isMakerTokenWETH && (getBalance(order.tokenSell, order.maker) < amountSellFilled // Don't double check makerToken if WETH
        || getAllowance(order.tokenSell, order.maker) < amountSellFilled)
        ) return false;
        if (!isTakerTokenWETH && (getBalance(order.tokenBuy, taker) < amountBuyToFill // Don't double check takerToken if WETH
        || getAllowance(order.tokenBuy, taker) < amountBuyToFill)
        ) return false;

        return true;
    }

    /// @dev Get token balance of an address.
    /// @param token Address of token.
    /// @param owner Address of owner.
    /// @return Token balance of owner.
    function getBalance(address token, address owner)
    internal
    view
    returns (uint)
    {
        return ERC20(token).balanceOf(owner);
    }

    /// @dev Get allowance of token given to TokenTransferProxy by an address.
    /// @param token Address of token.
    /// @param owner Address of owner.
    /// @return Allowance of token given to TokenTransferProxy by owner.
    function getAllowance(address token, address owner)
    internal
    view
    returns (uint)
    {
        return ERC20(token).allowance(owner, address(this));
    }
}