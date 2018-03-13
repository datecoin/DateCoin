pragma solidity ^0.4.18;

import '../DateCoinCrowdsale.sol';

contract DateCoinCrowdsaleTestable is DateCoinCrowdsale {

  function DateCoinCrowdsaleTestable(uint256 _startTime,
                                     uint256 _endTime,
                                     uint256 _rate,
                                     address _wallet,
                                     address _tokenContractAddress,
                                     address _vault,
                                     address _preSaleVault) public
    DateCoinCrowdsale(_startTime,
                      _endTime,
                      _rate,
                      _wallet,
                      _tokenContractAddress,
                      _vault,
                      _preSaleVault)
  {
  }

  function discount(uint8 _percent) public view returns (uint256) {
    return _discount(_percent);
  }

  function hasStarted() public view returns (bool) {
    return startTime <= now || manualState == ManualState.WORKING;
  }

  function calculateTokens(uint256 _tokens, uint8 _percent, uint256 _totalSupplied) public view returns (uint256) {
    return _calculateTokens(_tokens, _percent, _totalSupplied);
  }
}
