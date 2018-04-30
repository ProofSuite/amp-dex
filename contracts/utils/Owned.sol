pragma solidity ^0.4.19;

contract Owned {
  address public owner;
  function Owned() public {
    owner = msg.sender;
  }
  event SetOwner(address indexed previousOwner, address indexed newOwner);
  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }
  function setOwner(address newOwner) public onlyOwner {
    SetOwner(owner, newOwner);
    owner = newOwner;
  }
}