pragma solidity 0.4.24;

import "../interfaces/ERC20.sol";
import "./WETH9.sol";

contract SetupAccount {

    address public exchangeAddress;
    address public wethAddress;

    constructor (
        address _exchangeAddress,
        address _wethAddress
    ) public {
        exchangeAddress = _exchangeAddress;
        wethAddress = _wethAddress;
    }

    //The setup account function sets up the account of a trader by carrying out the following actions:
    //1) approve the tokens that the trader wishes to trades
    //2) deposit ETH into WETH if the trader wants to trade WETH.
    function setup(
        address[] _tokenAddresses, 
        uint256[] _values
    ) public payable {
        for (uint i = 0; i < _tokenAddresses.length; i++) {
            _tokenAddresses[i].delegatecall(abi.encodeWithSignature("approve(address,uint256)", exchangeAddress, _values[i]));
        }

        if (msg.value != 0) {
            wethAddress.delegatecall(abi.encodeWithSignature("deposit()"));
        }
    }

    function approveTokens(
        address[] _tokenAddresses,
        uint256[] _values
    ) public {
        for (uint i = 0; i < _tokenAddresses.length; i++) {
            _tokenAddresses[i].delegatecall(abi.encodeWithSignature("approve(address,uint256)", exchangeAddress, _values[i]));
        }
    }
}