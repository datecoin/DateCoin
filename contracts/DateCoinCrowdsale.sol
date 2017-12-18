pragma solidity ^0.4.18;

// DateCoin 
import './DateCoin.sol';
import './SaleLimitCrowdsale.sol';

// Zeppelin
import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract DateCoinCrowdsale is SaleLimitCrowdsale {

  uint256 public decimals = 18;
  uint256 public emission;

  // Tokens for future sales
  address frozenTokensWallet;
  // Team tokens
  address teamTokensWallet;
  // Discount border-lines
  mapping(uint8 => uint256) discountTokens;
  // Pre-sale delta
  uint256 borderDelta = 0;
  uint256 preSaleLimit = 0;


  function DateCoinCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _limit, uint256 _emission, address _wallet, address _frozenTokensWallet, address _teamTokensWallet, address _tokenContractAddress) public
    SaleLimitCrowdsale(_limit)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    require(_emission > 0 && _limit < _emission);
    require(_frozenTokensWallet != address(0));
    require(_teamTokensWallet != address(0));

    token = DateCoin(_tokenContractAddress);
    decimals = DateCoin(token).decimals();

    frozenTokensWallet = _frozenTokensWallet;
    teamTokensWallet = _teamTokensWallet;
    defineDiscountBorderLines();
    icoLimit = icoLimit.mul(1 ether);
    emission = _emission.mul(1 ether);
  }

  // overriding Crowdsale#buyTokens
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;
    uint256 totalSupplied = token.totalSupply();

    uint256 tokens = weiAmount.mul(rate);

    if (totalSupplied < _discountWithDelta(25)) {
      tokens = _calculateTokens(tokens, 75, totalSupplied);
    }
    else if (totalSupplied >= _discountWithDelta(25) && totalSupplied < _discountWithDelta(20)) {
      tokens = _calculateTokens(tokens, 80, totalSupplied);
    }
    else if (totalSupplied >= _discountWithDelta(20) && totalSupplied < _discountWithDelta(15)) {
      tokens = _calculateTokens(tokens, 85, totalSupplied);
    }
    else if (totalSupplied >= _discountWithDelta(15) && totalSupplied < _discountWithDelta(10)) {
      tokens = _calculateTokens(tokens, 90, totalSupplied);
    }
    else if (totalSupplied >= _discountWithDelta(10) && totalSupplied < _discountWithDelta(5)) {
      tokens = _calculateTokens(tokens, 95, totalSupplied);
    }

    // Check limit
    require(tokens.add(totalSupplied) <= _limitWithDelta());

    weiRaised = weiRaised.add(weiAmount);
    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }


  function transferPreSaleTokens(address _to, uint256 tokens) public onlyOwner {
    require(_to != address(0));
    require(tokens != 0);
    require(borderDelta.add(tokens) < preSaleLimit);

    token.mint(_to, tokens);
    borderDelta = borderDelta.add(tokens);
  }


  function transferUnsoldTokens() public onlyOwner {
    require(hasEnded());

    uint256 tokens = _limitWithDelta().sub(token.totalSupply());

    if (tokens > 0) {
      token.mint(frozenTokensWallet, tokens);
      // Lock tokens on frozenTokensWallet for 2 years
      DateCoin(token).setFrozenWallet(frozenTokensWallet);
      DateCoin(token).setFreezingDate(now + (2 years));
    }
  }


  function transferTeamTokens() public onlyOwner {
    require(hasEnded());

    uint256 tokens = emission.sub(_limitWithDelta());

    if (tokens > 0) {
      token.mint(teamTokensWallet, tokens);
    }
  }


  function transferOwnership(address _newOwner) public onlyOwner {
    token.transferOwnership(_newOwner);
  }

  // This method is used for definition of discountTokens borderlines
  function defineDiscountBorderLines() internal onlyOwner {
    discountTokens[25] = 12 * (1000000 ether);
    discountTokens[20] = 42 * (1000000 ether);
    discountTokens[15] = 92 * (1000000 ether);
    discountTokens[10] = 162 * (1000000 ether);
    preSaleLimit = 18 * (1000000 ether);
  }


  function _discountWithDelta(uint8 _percent) internal view returns (uint256) {
    return discountTokens[_percent].add(borderDelta);
  }


  function _limitWithDelta() internal view returns (uint256) {
    return icoLimit.add(borderDelta);
  }


  function _calculateTokens(uint256 _weiOnRate, uint8 _percent, uint256 _totalSupplied) internal view returns (uint256) {
    uint256 firstPart = _weiOnRate.mul(100).div(_percent);
    uint256 lastPart = 0;
    if (_totalSupplied.add(firstPart) > _discountWithDelta(100 - _percent)) {
      firstPart = _discountWithDelta(100 - _percent).sub(_totalSupplied);
      uint256 firstPartWei = firstPart.mul(_percent).div(100);
      lastPart = (_weiOnRate.sub(firstPartWei)).mul(100).div(_percent + 5);
    }
    return firstPart.add(lastPart);
  }
}
