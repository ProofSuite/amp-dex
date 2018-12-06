pragma solidity ^0.4.24;

contract WETH9 {
    string public name;
    string public symbol;
    uint8  public decimals;

    event  Approval(address indexed src, address indexed guy, uint wad);
    event  Transfer(address indexed src, address indexed dst, uint wad);
    event  Deposit(address indexed dst, uint wad);
    event  Withdrawal(address indexed src, uint wad);

    mapping(address => uint) public  balanceOf;
    mapping(address => mapping(address => uint)) public  allowance;

    function deposit() public payable {}
    function withdraw(uint wad) public {}
    function totalSupply() public view returns (uint) {}
    function approve(address guy, uint wad) public returns (bool) {}
    function transfer(address dst, uint wad) public returns (bool) {}
    function transferFrom(address src, address dst, uint wad) public returns (bool){}
}