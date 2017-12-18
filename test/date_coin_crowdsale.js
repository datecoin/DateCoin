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
  const wallet = accounts[9];
  const frozenTokensWallet = accounts[8];
  const teamTokensWallet = accounts[7];
  let contract = null;
  let token = null;

  let startTime = 0;
  let endTime = 0;
  let afterEndTime = 0;
  const rate = 4000;
  // Only for testing
  const icoLimit = 752;
  const emission = 1150;

  before(async () => await advanceBlock());

  beforeEach(async () => {
    startTime = latestTime() + duration.weeks(1);
    endTime = startTime + duration.weeks(1);
    afterEndTime = endTime + duration.seconds(1);
    token = await DateCoin.new({ from: owner });
    contract = await DateCoinCrowdsale.new(
      startTime,
      endTime,
      rate,
      icoLimit,
      emission,
      wallet,
      frozenTokensWallet,
      teamTokensWallet,
      token.address,
      { from: owner },
    );
    await token.transferOwnership(contract.address);
  });

  describe('Contract params', () => {
    it('checkout owner', async () => {
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

    it('checkout wallets', async () => {
      const fundWallet = await contract.wallet.call();

      fundWallet.should.equal(wallet, 'Funds wallet');

      const frozenWallet = await contract.frozenWallet.call();

      frozenWallet.should.equal(frozenTokensWallet, 'Frozen tokens wallet');

      const teamWallet = await contract.teamWallet.call();

      teamWallet.should.equal(teamTokensWallet, 'Team tokens wallet');
    });

    it('wallet balances', async () => {
      const frozenTokens = await token.balanceOf.call(frozenTokensWallet);
      frozenTokens.should.be.bignumber.equal(ether(0), "Tokens weren't frozen");

      const teamTokens = await token.balanceOf.call(teamTokensWallet);
      teamTokens.should.be.bignumber.equal(
        ether(0),
        "Team doesn't have any tokens",
      );
    });

    it('check limits && decimals', async () => {
      const _icoLimit = await contract.icoLimit.call();
      _icoLimit.should.be.bignumber.equal(ether(752), 'ICO cap is 752');

      const decimals = await contract.decimals.call();
      decimals.should.be.bignumber.equal(
        web3.toBigNumber(18),
        'Token decimals is 18',
      );

      const _emission = await contract.emission.call();
      _emission.should.be.bignumber.equal(
        ether(1150),
        'Total emission is 1150',
      );
    });
  });

  describe('Normal buying cases', () => {
    it('buy tokens by 25% sale off', async () => {
      await increaseTimeTo(startTime);
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
      const totalSupplied = await token.totalSupply.call();
      expected = web3.fromWei(ether(6.7), 'ether');
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 6.7 DTC');
    });

    it('buy tokens by 20% sale off', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[3];

      await _passDiaposons({ contract, token, investor, to: 20 });

      // Buy for 20% sale off

      let value = ether(prices.SALE_20) * web3.toBigNumber(12);

      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[20] + 12), 'ether');

      const totalSupplied = await token.totalSupply.call();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 24 DTC');
    });

    it('buy tokens by 15% sale off', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[4];

      await _passDiaposons({ contract, investor, token, to: 15 });

      // Buy for 15% sale off

      let value = ether(prices.SALE_15) * web3.toBigNumber(1);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[15] + 1), 'ether');

      const totalSupplied = await token.totalSupply.call();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 43 DTC');
    });

    it('buy tokens by 10% sale off', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[5];

      await _passDiaposons({ contract, investor, token, to: 10 });

      // Buy for 10% sale off

      let value = ether(prices.SALE_10) * web3.toBigNumber(3);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[10] + 3), 'ether');

      const totalSupplied = await token.totalSupply.call();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 95 DTC');
    });

    it('buy tokens by 5% sale off', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[6];

      await _passDiaposons({ contract, investor, token, to: 5 });

      // Buy for 5% sale off

      let value = ether(prices.SALE_5) * web3.toBigNumber(5.5);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[5] + 5.5), 'ether');

      const totalSupplied = await token.totalSupply.call();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 167.5 DTC');
    });

    it('buy tokens by 0% sale off', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[7];

      await _passDiaposons({ contract, investor, token, to: 0 });

      // Buy for 0% sale off

      let value = ether(prices.PRICE) * web3.toBigNumber(3);
      await contract.sendTransaction({
        from: investor,
        value,
      });

      let expected = web3.fromWei(ether(_totalSupplied[0] + 3), 'ether');

      const totalSupplied = await token.totalSupply.call();
      web3
        .fromWei(totalSupplied, 'ether')
        .valueOf()
        .should.equal(expected.valueOf(), 'Total supply is 255 DTC');
    });
  });

  describe('Border-line buying cases', () => {
    it('from 25% to 20% pass', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[1];

      // Checkout of contract isn't ended
      const isEnded = await contract.hasEnded.call();
      isEnded.should.equal(false, `ICO hasn't finished yet`);

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
      let totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(11),
        'Total supply is 11 DTC',
      );

      // Buy 3 tokens by 25% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_25,
        tokens: 3,
      });

      // Checkout of total supply
      totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        web3.toBigNumber(13875000000000000000),
        'Total supply is 13.8125 DTC',
      );
    });

    it('from 20% to 15% pass', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[2];

      await _passDiaposons({ contract, investor, token, to: 20 });

      // Move totalSupply to border-line 15%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_20,
        tokens: 29,
      });

      // Checkout of total supply
      let totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(41),
        'Total supply is 41 DTC',
      );

      // Buy 5 tokens by 20% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_20,
        tokens: 5,
      });

      // Checkout of total supply
      totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('45764705882352941176', 'wei'),
        'Total supply is 45.764705882352941176 DTC',
      );

      //totalSupplied = await token.totalSupply.call();
      //totalSupplied.should.be.bignumber.equal(
      //web3.toWei('45705882352941176470', 'wei'),
      //'Total supply is 45.705882352941177 DTC',
      //);
    });

    it('from 15% to 10% pass', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[3];

      await _passDiaposons({ contract, investor, token, to: 15 });

      // Move totalSupply to border-line 10%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_15,
        tokens: 49,
      });

      // Checkout of total supply
      let totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(91),
        'Total supply is 91 DTC',
      );

      // Buy 4 tokens by 15% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_15,
        tokens: 4,
      });

      // Checkout of total supply
      totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('94833333333333333333', 'wei'),
        'Total supply is 94.833333333333333333 DTC',
      );
    });

    it('from 10% to 5% pass', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[4];

      await _passDiaposons({ contract, investor, token, to: 10 });

      // Move totalSupply to border-line 5%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_10,
        tokens: 69,
      });

      // Checkout of total supply
      let totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(161),
        'Total supply is 161 DTC',
      );

      // Buy 8 tokens by 10% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_10,
        tokens: 8,
      });

      // Checkout of total supply
      totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('168631578947368421052', 'wei'),
        'Total supply is 168.631578947368421052 DTC',
      );
    });

    it('from 5% to 0% pass', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[5];

      await _passDiaposons({ contract, investor, token, to: 5 });

      // Move totalSupply to border-line 0%
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_5,
        tokens: 89,
      });

      // Checkout of total supply
      let totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(251),
        'Total supply is 161 DTC',
      );

      // Buy 8 tokens by 0% cost
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_5,
        tokens: 8,
      });

      // Checkout of total supply
      totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        web3.toWei('258650000000000000000', 'wei'),
        'Total supply is 258.65 DTC',
      );
    });

    it('checkout of ICO limit', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[5];

      await _passDiaposons({ contract, investor, token, to: 0 });

      // Move totalSupply to border-line ICO limit
      await _sendTokens({
        contract,
        investor,
        saleOff: prices.PRICE,
        tokens: 499,
      });

      // Checkout of total supply
      let totalSupplied = await token.totalSupply.call();
      totalSupplied.should.be.bignumber.equal(
        ether(751),
        'Total supply is 751 DTC',
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

      // Send customer his pre-sale tokens
      await contract.transferPreSaleTokens(investor, ether(3));

      balance = await token.balanceOf.call(investor);
      balance.should.be.bignumber.equal(
        ether(3),
        'After getting pre-sale tokens',
      );

      const delta = await contract.delta.call();
      delta.should.be.bignumber.equal(ether(3), 'Delta is 3 DTC');

      const newBorderLine25 = await contract.discountWithDelta.call(25);
      newBorderLine25.should.be.bignumber.equal(
        ether(15),
        "Border-line's moved to 15 DTC to right",
      );

      const newBorderLine20 = await contract.discountWithDelta.call(20);
      newBorderLine20.should.be.bignumber.equal(
        ether(45),
        "Border-line's moved to 45 DTC to right",
      );

      const newBorderLine15 = await contract.discountWithDelta.call(15);
      newBorderLine15.should.be.bignumber.equal(
        ether(95),
        "Border-line's moved on 95 DTC to right",
      );

      const newBorderLine10 = await contract.discountWithDelta.call(10);
      newBorderLine10.should.be.bignumber.equal(
        ether(165),
        "Border-line's moved on 165 DTC to right",
      );

      const newBorderLine5 = await contract.discountWithDelta.call(5);
      newBorderLine5.should.be.bignumber.equal(
        ether(255),
        "Border-line's moved on 255 DTC to right",
      );

      const icoLimit = await contract.limitWithDelta.call();
      icoLimit.should.be.bignumber.equal(
        ether(755),
        "Border-line's moved on 755 DTC to right",
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
        .transferPreSaleTokens(investor, ether(19))
        .should.be.rejectedWith(EVMRevert);
    });
  });

  describe('Finish ICO', () => {
    beforeEach(async () => {
      token = await DateCoin.new({ from: owner });
      startTime = latestTime() + duration.weeks(1);
      endTime = startTime + duration.weeks(1);
      afterEndTime = endTime + duration.seconds(1);
      contract = await DateCoinCrowdsale.new(
        startTime,
        endTime,
        rate,
        icoLimit,
        emission,
        wallet,
        frozenTokensWallet,
        teamTokensWallet,
        token.address,
        { from: owner },
      );
      await token.transferOwnership(contract.address);
    });

    it('fund balance', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[2];

      const beforeBalance = await web3.eth.getBalance(wallet);

      await _sellAllTokens({ contract, investor, token });

      const isEnded = await contract.hasEnded.call();

      isEnded.should.equal(true, 'ICO has ended');

      const afterBalance = await web3.eth.getBalance(wallet);

      const diff = afterBalance - beforeBalance;

      diff.should.be.bignumber.equal(ether(0.181), 'You earn 0.181 ETH');
    });

    it('transfer tokens left', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[2];

      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_25,
        tokens: 10,
      });

      await increaseTimeTo(afterEndTime);

      const isEnded = await contract.hasEnded.call();
      isEnded.should.equal(true, 'ICO has ended by end time');

      await contract.transferUnsoldTokens();

      const frozenTokensBalance = await token.balanceOf.call(
        frozenTokensWallet,
      );

      frozenTokensBalance.should.be.bignumber.equal(
        ether(742),
        '743 DTC have been frozen',
      );
    });

    it('transfer team tokens', async () => {
      await increaseTimeTo(startTime);
      const investor = accounts[2];

      await _sendTokens({
        contract,
        investor,
        saleOff: prices.SALE_25,
        tokens: 10,
      });

      await contract.transferPreSaleTokens(accounts[3], ether(12));

      await increaseTimeTo(afterEndTime);

      const isEnded = await contract.hasEnded.call();
      isEnded.should.equal(true, 'ICO has ended by end time');

      await contract.transferTeamTokens();

      const limitWithDelta = await contract.limitWithDelta.call();

      const teamTokensBalance = await token.balanceOf.call(teamTokensWallet);

      const teamTokens = ether(1150) - limitWithDelta;

      teamTokensBalance.should.be.bignumber.equal(
        teamTokens,
        `Team tokens is ${web3.fromWei(teamTokens, 'ether')}`,
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
