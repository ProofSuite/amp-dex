pragma solidity 0.4.24;

import './utils/Owned.sol';
import './interfaces/ProofToken.sol';
import './interfaces/ERC20.sol';
import './RewardPools.sol';

contract RewardCollector is Owned {
  ProofTokenInterface public proofToken;
  address public rewardPools;

  modifier onlyRewardsPool {
    require(msg.sender == rewardPools);
    _;
  }

  function () public payable
  {
    revert();
  }

  function setRewardPools(address _rewardPools) public
  {
    rewardPools = _rewardPools;
  }

  function RewardCollector(address _PRFTAddress) public
  {
    proofToken = ProofTokenInterface(_PRFTAddress);
  }

  function transferTokensToPool(address _tokenAddress, uint256 _value) onlyRewardsPool public
  {
    require(ERC20(_tokenAddress).transfer(rewardPools, _value));
  }
}