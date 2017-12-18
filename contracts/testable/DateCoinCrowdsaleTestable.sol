pragma solidity ^0.4.18;

import '../DateCoinCrowdsale.sol';

contract DateCoinCrowdsaleTestable is DateCoinCrowdsale {

  function DateCoinCrowdsaleTestable(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _limit, uint256 _emission, address _wallet, address _frozenTokensWallet, address _teamTokensWallet, address _tokenContractAddress) public
    DateCoinCrowdsale(_startTime, _endTime, _rate, _limit, _emission, _wallet, _frozenTokensWallet, _teamTokensWallet, _tokenContractAddress)
  {
  }

  function frozenWallet() public constant returns (address) {
    return frozenTokensWallet;
  }

  function teamWallet() public constant returns (address) {
    return teamTokensWallet;
  }

  function delta() public constant returns (uint256) {
    return borderDelta;
  }

  // overriding DateCoinCrowdsale#defineDiscountBorderLines for changing discount borderlines
  function defineDiscountBorderLines() internal onlyOwner {
    discountTokens[25] = 12 * (1 ether);
    discountTokens[20] = 42 * (1 ether);
    discountTokens[15] = 92 * (1 ether);
    discountTokens[10] = 162 * (1 ether);
    discountTokens[5] = 252 * (1 ether);
    preSaleLimit = 18 * (1 ether);
  }


  function discountWithDelta(uint8 _percent) public view returns (uint256) {
    return _discountWithDelta(_percent);
  }


  function limitWithDelta() public view returns (uint256) {
    return _limitWithDelta();
  }


  function calculateTokens(uint256 _tokens, uint8 _percent, uint256 _totalSupplied) public view returns (uint256) {
    return _calculateTokens(_tokens, _percent, _totalSupplied);
  }
}
