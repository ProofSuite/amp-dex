pragma solidity ^0.4.17;

contract ERC20 {
  string public name;
  string public symbol;
  uint256 public totalSupply;
  uint8 public decimals;
  bool public allowTransactions;
  mapping (address => uint256) public balanceOf;
  mapping (address => mapping (address => uint256)) public allowance;

  function transfer(address _to, uint256 _value) external returns (bool);
  function approveAndCall(address _spender, uint256 _value, bytes _extraData) external returns (bool);
  function approve(address _spender, uint256 _value) external returns (bool);
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool);
}

