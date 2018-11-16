pragma solidity 0.4.24;

import './utils/SafeMath.sol';
import './utils/Owned.sol';
import './interfaces/ProofToken.sol';
import './interfaces/ERC20.sol';
import './interfaces/RewardCollector.sol';


contract RewardPools is Owned {

  using SafeMath for uint256;
  ProofTokenInterface public proofToken;

  address public rewardCollector;

  uint256 public blocksPerEpoch;
  uint256 public creationBlockNumber;
  uint256 public currentEpoch;
  uint256 public currentPoolIndex;
  uint256 public currentPoolBalance;

  mapping(uint256 => mapping(address => uint256)) public poolBalances;
  mapping(uint256 => uint256) public nthPoolBalance;
  mapping(address => uint256) public withdrawals;

  mapping(address => ERC20) public quotes;
  address[] public quoteList;


  function RewardPools(address _PRFTAddress, address _rewardCollector) public
  {
    proofToken = ProofTokenInterface(_PRFTAddress);
    rewardCollector = _rewardCollector;
  }

  function () public payable
  {
    revert();
  }

  function registerQuoteToken(address _tokenAddress) onlyOwner public {
    quotes[_tokenAddress] = ERC20(_tokenAddress);
  }

  function withdrawRewards() public
  {
    require(msg.sender != 0x0);
    checkCurrentEpoch();

    uint256 withdrawalValue = 0;
    uint256 lastWithdrawal = withdrawals[msg.sender];
    require(lastWithdrawal != currentEpoch);


    for (uint256 i = 0; i < quoteList.length; i++) {
      address tokenAddress = quoteList[i];

      for (uint256 j = lastWithdrawal; j < currentEpoch; j++)
      {
        uint256 blockNumberAtEpochStart = getBlockNumberAtEpochStart(j);
        uint256 balanceAtEpochStart = proofToken.balanceOfAt(msg.sender, blockNumberAtEpochStart);
        uint256 totalSupply = proofToken.totalSupply();

        uint256 currentPoolTokenRewards = (poolBalances[j][tokenAddress] * balanceAtEpochStart) / totalSupply;
        uint256 totalTokenRewards = totalTokenRewards + currentPoolTokenRewards;
      }

      ERC20(tokenAddress).transfer(msg.sender, totalTokenRewards);
    }

    withdrawals[msg.sender] = currentEpoch;
  }

  function checkCurrentEpoch() internal
  {
    uint256 lastEpoch = currentEpoch;
    uint256 computedEpoch = computeCurrentEpoch();

    if (computedEpoch != lastEpoch) {
      for(uint256 i = 0; i < quoteList.length; i++) {
        address tokenAddress = quoteList[i];
        uint256 tokenBalance = ERC20(tokenAddress).balanceOf(owner);

        RewardCollectorInterface(rewardCollector).transferTokensToPool(tokenAddress, tokenBalance);
        poolBalances[lastEpoch][tokenAddress] = tokenBalance;
      }

      currentEpoch = computedEpoch;
    }
  }

  function computeCurrentEpoch() public view returns(uint256 computedCurrentEpoch)
  {
    computedCurrentEpoch = (block.number - creationBlockNumber) / blocksPerEpoch;
    return computedCurrentEpoch;
  }

  function getBlockNumberAtEpochStart(uint256 _epoch) public view returns(uint256 blockNumber)
  {
    blockNumber = creationBlockNumber + blocksPerEpoch * _epoch;
    return blockNumber;
  }
}