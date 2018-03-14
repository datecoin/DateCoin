import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import {
  _sendTokens,
  _passDiaposons,
  _totalSupplied,
  _sellAllTokens,
  prices,
} from './crowdsale_helpers';

var DateCoinCrowdsale = artifacts.require('DateCoinCrowdsaleTestable');
var DateCoin = artifacts.require('DateCoin');

const { BigNumber } = web3;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// Contract

contract('DateCoin Crowdsale', accounts => {
  const owner = accounts[0];
  let contract = null;
  let token = null;

  let startTime = 0;
  let endTime = 0;
  let afterEndTime = 0;
  const rate = 4000;
  // Only for testing
  const cap = web3.toBigNumber(290769231);

  // Accounts
  const team = accounts[19];
  const adviser1 = accounts[18];
  const adviser2 = accounts[17];
  const bounty = accounts[16];
  const marketing = accounts[15];
  const reserved = accounts[14];
  const preSale = accounts[13];
  const crowdsale = accounts[12];
  const wallet = accounts[11];

  // Amounts

  // 34 892 307
  const teamAmount = 34892307;
  // 11 630 769
  const adviser1Amount = 11630769;
  // 11 630 769
  const adviser2Amount = 11630769;
  // 2 907 692
  const bountyAmount = 2907692;
  // 11 630 769
  const marketingAmount = 11630769;
  // +29 076 923
  const reservedAmount = 29076924;
  // 18 000 000
  const preSaleAmount = 18000000;
  // 171 000 000
  const crowdsaleAmount = 171000000;
  // 189 000 000
  // Total: 290 769 230

  before(async () => await advanceBlock());

  beforeEach(async () => {
    startTime = latestTime() + duration.weeks(1);
    endTime = startTime + duration.weeks(1);
    afterEndTime = endTime + duration.seconds(1);

    token = await DateCoin.new(ether(cap), { from: owner });

    await token.mint(team, ether(teamAmount));
    await token.mint(adviser1, ether(adviser1Amount));
    await token.mint(adviser2, ether(adviser2Amount));
    await token.mint(bounty, ether(bountyAmount));
    await token.mint(marketing, ether(marketingAmount));
    await token.mint(reserved, ether(reservedAmount));
    await token.mint(preSale, ether(preSaleAmount));
    await token.mint(crowdsale, ether(crowdsaleAmount));
    await token.finishMinting();

    const yearReleaseTime = latestTime() + duration.years(1);
    const halfYearReleaseTime = latestTime() + duration.months(6);

    await token.lockAccount(team, yearReleaseTime);
    await token.lockAccount(adviser2, halfYearReleaseTime);
    await token.lockAccount(reserved, halfYearReleaseTime);

    contract = await DateCoinCrowdsale.new(
      startTime,
      endTime,
      rate,
      wallet,
      token.address,
      crowdsale,
      preSale,
      { from: owner },
    );

    await token.approve(contract.address, ether(crowdsaleAmount), {
      from: crowdsale,
    });

    await token.approve(contract.address, ether(preSaleAmount), {
      from: preSale,
    });

    await token.transferOwnership(contract.address);
  });

  describe('Contract', () => {
    it('should have right owners', async () => {
      // Checkout crowdsale owner
      const _owner = await contract.owner.call();
      _owner.should.equal(owner, `Contract owner is ${owner}`);

      const contractAddress = contract.address;

      // Checkout token owner
      const tokenOwner = await token.owner.call();

      tokenOwner.should.equal(
        contractAddress,
        `DateCoin owner is Crowdsale contract`,
      );
    });

    it('should have set accounts', async () => {
      const fundWallet = await contract.wallet.call();

      fundWallet.should.equal(wallet, 'Funds wallet');

      const vaultWallet = await contract.vault.call();

      vaultWallet.should.equal(crowdsale, 'Vault tokens wallet');

      const preSaleWallet = await contract.preSaleVault.call();

      preSaleWallet.should.equal(preSale, 'PreSale tokens wallet');
    });

    it('should have enough amount for selling', async () => {
      const amount = await token.allowance(crowdsale, contract.address);
      amount
        .valueOf()
        .should.equal(ether(crowdsaleAmount).valueOf(), 'Amount for crowdsale');

      const _preSaleAmount = await token.allowance(preSale, contract.address);
      _preSaleAmount
        .valueOf()
        .should.equal(ether(preSaleAmount).valueOf(), 'Amount for preSale');
    });

    it('should allow to transfer calculated token', async () => {
      await increaseTimeTo(startTime);
      const anotherAccount = accounts[5];

      await contract.transferTokens(anotherAccount, ether(10));

      const balance = await token.balanceOf(anotherAccount);

      balance.should.be.bignumber.equal(ether(10), 'Tokens were transfered');
    });
  });

  describe('AutoSeller', () => {
    it('should enable auto seller', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of investor balance before buying
      const beforeBalance = await token.balanceOf.call(investor);
      beforeBalance
        .valueOf()
        .should.equal(String(0), 'Balance of investor is empty');

      // Buy 1.5 tokens
      let value = web3.toBigNumber(1.5) * ether(prices.SALE_25);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      // Checkout of investor balance after buying
      const investorBalance = await token.balanceOf.call(investor);
      let expected = web3.fromWei(ether(1.5), 'ether');
      web3
        .fromWei(investorBalance.valueOf(), 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Balance of investor is 1.5 DTC');
    });

    it('should disable auto seller', async () => {
      await increaseTimeTo(startTime);
      await contract.disableAutoSeller();
      const investor = accounts[1];

      // Checkout of investor balance before buying
      const beforeBalance = await token.balanceOf.call(investor);
      beforeBalance
        .valueOf()
        .should.equal(String(0), 'Balance of investor is empty');

      // Buy 1.5 tokens
      let value = web3.toBigNumber(1.5) * ether(prices.SALE_25);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      // Checkout of investor balance after buying
      const investorBalance = await token.balanceOf.call(investor);
      let expected = web3.fromWei(ether(0), 'ether');
      web3
        .fromWei(investorBalance.valueOf(), 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Balance of investor is 1.5 DTC');
    });

    it('should contain pending orders info for account', async () => {
      await increaseTimeTo(startTime);
      await contract.disableAutoSeller();
      const investor = accounts[1];

      // Buy 1.5 tokens
      let value = web3.toBigNumber(1) * ether(prices.SALE_25);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      const hasPendingOrders = await contract.hasAccountPendingOrders(investor);

      assert.equal(hasPendingOrders, true, 'Investor has pending orders');

      const pendingOrders = await contract.getAccountPendingValue(investor);
      let expected = web3.fromWei(ether(0.0001875), 'ether');
      web3
        .fromWei(pendingOrders.valueOf(), 'ether')
        .valueOf()
        .should.equal(
          expected.valueOf(),
          'Pending value of investor is 0.0001875 ETH',
        );
    });

    it('should not contain pending orders on enabled', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Buy 1.5 tokens
      let value = web3.toBigNumber(1) * ether(prices.SALE_25);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      const hasPendingOrders = await contract.hasAccountPendingOrders(investor);

      assert.equal(
        hasPendingOrders,
        false,
        "Investor hasn't got pending orders",
      );

      const pendingOrders = await contract.getAccountPendingValue(investor);
      let expected = web3.fromWei(ether(0), 'ether');
      web3
        .fromWei(pendingOrders.valueOf(), 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Pending value of investor is 0 ETH');
    });
  });

  describe('Normal buying cases', () => {
    it('buy tokens by 25% sale off', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of contract isn't ended
      const isEnded = await contract.hasEnded.call();
      isEnded.should.equal(false, `ICO hasn't finished yet`);

      // Checkout of investor balance before buying
      const beforeBalance = await token.balanceOf.call(investor);
      beforeBalance
        .valueOf()
        .should.equal(String(0), 'Balance of investor is empty');

      // Buy 1.5 tokens
      let value = web3.toBigNumber(1.5) * ether(prices.SALE_25);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      // Checkout of investor balance after buying
      const investorBalance = await token.balanceOf.call(investor);
      let expected = web3.fromWei(ether(1.5), 'ether');
      web3
        .fromWei(investorBalance.valueOf(), 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Balance of investor is 1.5 DTC');

      // Buy 5.2 tokens
      value = web3.toBigNumber(5.2) * ether(prices.SALE_25);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      // Checkout of total supply
      const sold = await contract.totalSold();
      expected = web3.fromWei(ether(6.7), 'ether');
      web3
        .fromWei(sold, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 6.7 DTC');
    });

    it('buy tokens by 20% sale off', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[3];

      await _passDiaposons({ contract, token, investor, to: 20 });

      // Buy for 20% sale off

      let value = ether(prices.SALE_20) * web3.toBigNumber(12);

      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[20] + 12), 'ether');

      const totalSupplied = await contract.totalSold();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), "Total supply is 5'700'012 DTC");
    });

    it('buy tokens by 15% sale off', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[4];

      await _passDiaposons({ contract, investor, token, to: 15 });

      // Buy for 15% sale off

      let value = ether(prices.SALE_15) * web3.toBigNumber(1);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[15] + 1), 'ether');

      const totalSupplied = await contract.totalSold();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), "Total supply is 17'100'001 DTC");
    });

    it('buy tokens by 10% sale off', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[5];

      await _passDiaposons({ contract, investor, token, to: 10 });

      // Buy for 10% sale off

      let value = ether(prices.SALE_10) * web3.toBigNumber(3);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[10] + 3), 'ether');

      const totalSupplied = await contract.totalSold();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), "Total supply is 34'200'003 DTC");
    });

    it('buy tokens by 5% sale off', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[6];

      await _passDiaposons({ contract, investor, token, to: 5 });

      // Buy for 5% sale off

      let value = ether(prices.SALE_5) * web3.toBigNumber(5.5);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[5] + 5.5), 'ether');

      const totalSupplied = await contract.totalSold();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), "Total supply is 57'000'005.5 DTC");
    });

    it('buy tokens by 0% sale off', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[7];

      await _passDiaposons({ contract, investor, token, to: 0 });

      // Buy for 0% sale off

      let value = ether(prices.PRICE) * web3.toBigNumber(3);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[0] + 3), 'ether');

      const totalSupplied = await contract.totalSold();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), "Total supply is 85'500'003 DTC");
    });
  });

  describe('Border-line buying cases', () => {
    it('from 25% to 20% pass', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of contract isn't ended
      const isEnded = await contract.hasEnded.call();
      isEnded.should.equal(false, "ICO hasn't finished yet");

      // Checkout of investor balance before buying
      const beforeBalance = await token.balanceOf.call(investor);
      beforeBalance
        .valueOf()
        .should.equal(String(0), 'Balance of investor is empty');

      // Buy 11 tokens
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_25,
        tokens: 11,
      });

      // Checkout of total supply
      let totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        ether(11),
        'Total supply is 11 DTC',
      );

      // Buy 3 tokens by 25% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_25,
        tokens: 5700000,
      });

      // Checkout of total supply
      totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        '5.7000103125e+24',
        "Total supply is 5'700'010.3125 DTC",
      );
    });

    it('from 20% to 15% pass', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[2];

      await _passDiaposons({ contract, investor, token, to: 20 });

      // Move totalSupply to border-line 15%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_20,
        tokens: 11399998,
      });

      // Checkout of total supply
      let totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        ether(17099998),
        "Total supply is 17'099'998 DTC",
      );

      // Buy 5 tokens by 20% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_20,
        tokens: 5,
      });

      // Checkout of total supply
      totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('17100002823529411764705882', 'wei'),
        "Total supply is 17'100'002.823 DTC",
      );
    });

    it('from 15% to 10% pass', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[3];

      await _passDiaposons({ contract, investor, token, to: 15 });

      // Move totalSupply to border-line 10%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_15,
        tokens: 17099998,
      });

      // Checkout of total supply
      let totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        ether(34199998),
        "Total supply is 34'199'998 DTC",
      );

      // Buy 4 tokens by 15% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_15,
        tokens: 4,
      });

      // Checkout of total supply
      totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('34200001888888888888888888', 'wei'),
        "Total supply is 34'200'001.888 DTC",
      );
    });

    it('from 10% to 5% pass', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[4];

      await _passDiaposons({ contract, investor, token, to: 10 });

      // Move totalSupply to border-line 5%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_10,
        tokens: 22799996,
      });

      // Checkout of total supply
      let totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        ether(56999996),
        "Total supply is 57'999'996 DTC",
      );

      // Buy 8 tokens by 10% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_10,
        tokens: 8,
      });

      // Checkout of total supply
      totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('57000003789473684210526315', 'wei'),
        "Total supply is 57'000'003.789 DTC",
      );
    });

    it('from 5% to 0% pass', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[5];

      await _passDiaposons({ contract, investor, token, to: 5 });

      // Move totalSupply to border-line 0%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_5,
        tokens: 28499998,
      });

      // Checkout of total supply
      let totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        ether(85499998),
        "Total supply is 85'499'998 DTC",
      );

      // Buy 8 tokens by 0% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_5,
        tokens: 8,
      });

      // Checkout of total supply
      totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('85500005700000000000000000', 'wei'),
        "Total supply is 85'500'005.7 DTC",
      );
    });

    it('checkout of ICO limit', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[5];

      await _passDiaposons({ contract, investor, token, to: 0 });

      // Move totalSupply to border-line ICO limit
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.PRICE,
        tokens: 85500000,
      });

      // Checkout of total supply
      let totalSupplied = await contract.totalSold();
      totalSupplied.should.be.bignumber.equal(
        ether(171000000),
        "Total supply is 171'000'000 DTC",
      );

      // Try to buy more than available tokens for ICO
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.PRICE,
        tokens: 3,
      }).should.be.rejectedWith(EVMRevert);
    });
  });

  describe('Pre-sale cases', () => {
    it('Move border-lines', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[2];

      let balance = await token.balanceOf.call(investor);
      balance.should.be.bignumber.equal(
        ether(0),
        'Before getting pre-sale tokens',
      );

      const crowdsaleTokensBefore = await contract.totalSold();
      const preSaleBalanceBefore = await token.balanceOf(preSale);

      // Send customer his pre-sale tokens
      await contract.transferPreSaleTokens(investor, ether(3));

      balance = await token.balanceOf.call(investor);
      balance.should.be.bignumber.equal(
        ether(3),
        'After getting pre-sale tokens',
      );

      const crowdsaleTokensAfter = await contract.totalSold();
      const preSaleBalanceAfter = await token.balanceOf(preSale);

      crowdsaleTokensBefore.should.be.bignumber.equal(
        crowdsaleTokensAfter,
        "Crowdsale balance wasn't changed",
      );
      preSaleBalanceAfter.should.be.bignumber.equal(
        preSaleBalanceBefore - ether(3),
        'Pre sale balance was changed',
      );
    });

    it('Tried to send more then pre-sale limit', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[2];

      let balance = await token.balanceOf.call(investor);
      balance.should.be.bignumber.equal(
        ether(0),
        'Before getting pre-sale tokens',
      );

      // Send customer more pre-sale limit
      await contract
        .transferPreSaleTokens(investor, ether(preSaleAmount + 1))
        .should.be.rejectedWith(EVMRevert);
    });
  });

  describe('Manual start/finish control', () => {
    it('should start before startTime', async () => {
      await increaseTimeTo(latestTime());
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isStarted = await contract.hasStarted();
      isStarted.should.equal(false, "ICO isn't started yet");

      await contract.startCrowdsale();

      isStarted = await contract.hasStarted();
      isStarted.should.equal(true, 'ICO is started');
    });

    it('should finish at the middle of period', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isEnded = await contract.hasEnded.call();
      isEnded.should.equal(false, "ICO isn't finished yet");

      await contract.finishCrowdsale();

      isEnded = await contract.hasEnded.call();
      isEnded.should.equal(true, 'ICO is finished');
    });

    it('should start after endTime', async () => {
      await increaseTimeTo(endTime + duration.days(1));
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isEnded = await contract.hasEnded();
      isEnded.should.equal(true, 'ICO is finished');

      await contract.startCrowdsale();

      isEnded = await contract.hasEnded();
      isEnded.should.equal(false, 'ICO was started again');
    });

    it('should sell tokens before startTime and enough vault balance', async () => {
      await increaseTimeTo(latestTime());
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isStarted = await contract.hasStarted();
      isStarted.should.equal(false, "ICO isn't started");

      await contract.startCrowdsale();

      let balance = await token.balanceOf(investor);
      balance.should.be.bignumber.equal(
        ether(0),
        'Investor balance before transaction',
      );

      await contract.sendTransaction({
        from: investor,
        value: ether('0.0001875'),
      });

      balance = await token.balanceOf(investor);
      balance.should.be.bignumber.equal(ether(1), 'Investor bought 1 DTC');
    });

    it('should revert sell tokens before startTime and not enough vault balance', async () => {
      await increaseTimeTo(latestTime());
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isStarted = await contract.hasStarted();
      isStarted.should.equal(false, "ICO isn't started");

      await contract.startCrowdsale();

      await _sellAllTokens({ contract, investor, token });

      await contract
        .sendTransaction({
          from: investor,
          value: ether('0.00001875'),
        })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should sell tokens after endTime and enough vault balance', async () => {
      await increaseTimeTo(endTime + duration.days(1));
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isEnded = await contract.hasEnded();
      isEnded.should.equal(true, 'ICO is finished');

      await contract.startCrowdsale();

      isEnded = await contract.hasEnded();
      isEnded.should.equal(false, 'ICO was started again');

      let balance = await token.balanceOf(investor);
      balance.should.be.bignumber.equal(
        ether(0),
        'Investor balance before transaction',
      );

      await contract.sendTransaction({
        from: investor,
        value: ether('0.0001875'),
      });

      balance = await token.balanceOf(investor);
      balance.should.be.bignumber.equal(ether(1), 'Investor bought 1 DTC');
    });

    it('should revert sell tokens before startTime and not enough vault balance', async () => {
      await increaseTimeTo(endTime + duration.days(1));
      await contract.enableAutoSeller();
      const investor = accounts[1];

      // Checkout of contract isn't ended
      let isEnded = await contract.hasEnded();
      isEnded.should.equal(true, 'ICO is finished');

      await contract.startCrowdsale();

      isEnded = await contract.hasEnded();
      isEnded.should.equal(false, 'ICO was started again');

      await _sellAllTokens({ contract, investor, token });

      await contract
        .sendTransaction({
          from: investor,
          value: ether('0.00001875'),
        })
        .should.be.rejectedWith(EVMRevert);
    });
  });

  describe('Finish ICO', () => {
    beforeEach(async () => {
      startTime = latestTime() + duration.weeks(1);
      endTime = startTime + duration.weeks(1);
      afterEndTime = endTime + duration.seconds(1);

      token = await DateCoin.new(ether(cap), { from: owner });

      await token.mint(team, ether(teamAmount));
      await token.mint(adviser1, ether(adviser1Amount));
      await token.mint(adviser2, ether(adviser2Amount));
      await token.mint(bounty, ether(bountyAmount));
      await token.mint(marketing, ether(marketingAmount));
      await token.mint(reserved, ether(reservedAmount));
      await token.mint(preSale, ether(preSaleAmount));
      await token.mint(crowdsale, ether(crowdsaleAmount));
      await token.finishMinting();

      const yearReleaseTime = latestTime() + duration.years(1);
      const halfYearReleaseTime = latestTime() + duration.months(6);

      await token.lockAccount(team, yearReleaseTime);
      await token.lockAccount(adviser2, halfYearReleaseTime);
      await token.lockAccount(reserved, halfYearReleaseTime);

      contract = await DateCoinCrowdsale.new(
        startTime,
        endTime,
        rate,
        wallet,
        token.address,
        crowdsale,
        preSale,
        { from: owner },
      );

      await token.approve(contract.address, ether(crowdsaleAmount), {
        from: crowdsale,
      });

      await token.approve(contract.address, ether(preSaleAmount), {
        from: preSale,
      });

      await token.transferOwnership(contract.address);
    });

    it('fund balance', async () => {
      await increaseTimeTo(startTime);
      await contract.enableAutoSeller();
      const investor = accounts[2];

      const beforeBalance = await web3.eth.getBalance(wallet);

      await _sellAllTokens({ contract, investor, token });

      const isEnded = await contract.hasEnded.call();

      isEnded.should.equal(true, 'ICO has ended');

      const afterBalance = await web3.eth.getBalance(wallet);

      const diff = web3.toBigNumber(afterBalance - beforeBalance);

      diff.should.be.bignumber.equal(
        web3.toBigNumber('40256250000003910000000'),
        "You earn 40'256.25000000391 ETH",
      );
    });

    it('transfer ownership on token', async () => {
      await increaseTimeTo(startTime);

      const tokenOwner = await token.owner.call();

      contract.address.should.equal(tokenOwner, 'Crowdsale is still owner');

      await contract.transferOwnership.call(accounts[3]);

      const newTokenOwner = await token.owner.call();

      newTokenOwner.should.not.equal(
        accounts[3],
        "Crowdsale isn't owner any more.",
      );
    });
  });
});
