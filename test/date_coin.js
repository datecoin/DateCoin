import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import assertRevert from './helpers/assertRevert';
import latestTime from './helpers/latestTime';

var DateCoin = artifacts.require('DateCoin');

contract('DateCoin', addresses => {
  let instance = null;
  const zeroAddress = '0x0';
  const tokenOwner = addresses[0];
  const cap = web3.toBigNumber(290769231);

  before(async () => await advanceBlock());

  beforeEach(async () => {
    instance = await DateCoin.new(cap, { from: tokenOwner });
  });

  it('check owner', async () => {
    const owner = await instance.owner();
    assert.equal(tokenOwner, owner, 'Owner contract is ' + owner);
  });

  it('check token params', async () => {
    const name = await instance.name.call();
    const symbol = await instance.symbol.call();
    const decimals = await instance.decimals.call();
    const totalSupplied = await instance.totalSupply();
    const isMintingFinished = await instance.mintingFinished.call();

    assert.equal('DateCoin ICO Token', name, 'Token name');
    assert.equal('DTC', symbol, 'Token symbol');
    assert.equal(18, decimals, 'Token decimals');
    assert.equal(
      web3.toBigNumber(0).valueOf(),
      totalSupplied.valueOf(),
      'Token cap is 0',
    );
  });

  it('owner should mint 1980 tokens to some user', async () => {
    const anotherAccount = addresses[1];

    const balanceAnotherAccountBefore = await instance.balanceOf.call(
      anotherAccount,
    );
    assert.equal(
      web3.toBigNumber(0).valueOf(),
      balanceAnotherAccountBefore.valueOf(),
      'Balance of anotherAccount is 0 before minting',
    );

    await instance.mint(anotherAccount, 1980, { from: tokenOwner });
    const balanceAnotherAccountAfter = await instance.balanceOf.call(
      anotherAccount,
    );
    assert.equal(
      web3.toBigNumber(1980).valueOf(),
      balanceAnotherAccountAfter.valueOf(),
      'Balance of anotherAccount is 1980 after minting',
    );
  });

  it('send tokens from owner to another account', async () => {
    const anotherAccount = addresses[2];

    const ownerBalance = await instance.balanceOf.call(tokenOwner);
    assert.equal(
      web3.toBigNumber(0).valueOf(),
      ownerBalance.valueOf(),
      `Balance of tokenOwner is 0`,
    );

    const beforeBalance = await instance.balanceOf.call(anotherAccount);
    assert.equal(
      0,
      beforeBalance.valueOf(),
      `Balance of ${anotherAccount} before minting.`,
    );

    await instance.mint(tokenOwner, 1000);
    await instance.transfer(anotherAccount, 1000);

    const balanceOwner = await instance.balanceOf.call(tokenOwner);
    assert.equal(
      web3.toBigNumber(0).valueOf(),
      balanceOwner.valueOf(),
      `Balance of tokenOwner is 0`,
    );

    const balance = await instance.balanceOf.call(anotherAccount);
    assert.equal(
      web3.toBigNumber(1000).valueOf(),
      balance.valueOf(),
      `Balance of anotherAccount after transfering is 1000`,
    );

    await instance.transfer(tokenOwner, 9, { from: anotherAccount });

    const afterSendBalance = await instance.balanceOf.call(anotherAccount);
    assert.equal(
      web3.toBigNumber(991).valueOf(),
      afterSendBalance.valueOf(),
      `Balance of anotherAccount after minting is 991`,
    );
  });

  it('transfer ownership', async () => {
    const newOwner = addresses[1];

    assert.notEqual(zeroAddress, newOwner, 'Address is zero');

    const owner = await instance.owner.call();
    assert.equal(tokenOwner, owner, `Old owner is ${tokenOwner}`);

    await instance.transferOwnership(newOwner, { from: tokenOwner });

    const afterOwner = await instance.owner.call();
    assert.equal(newOwner, afterOwner, `New owner is ${newOwner}`);

    await instance.transferOwnership(tokenOwner, { from: newOwner });

    const backOwner = await instance.owner.call();
    assert.equal(tokenOwner, backOwner, `Old owner has come back`);
  });

  it('total supply', async () => {
    const investor = addresses[1];
    const tokenCount = 1952;

    const beforeTotalSupply = await instance.totalSupply();
    assert.equal(
      web3.toBigNumber(0).valueOf(),
      beforeTotalSupply.valueOf(),
      'Total supply is 0',
    );

    // Mint some tokens for investor
    await instance.mint(investor, tokenCount);

    const totalSupply = await instance.totalSupply();
    assert.equal(
      web3.toBigNumber(tokenCount).valueOf(),
      totalSupply.valueOf(),
      `Total supply is ${tokenCount}`,
    );
  });

  describe('Allowance cases', () => {
    beforeEach(async () => {
      instance = await DateCoin.new(cap, { from: tokenOwner });
    });

    it('approve transfering for sender', async () => {
      const foreignerAccount = addresses[3];
      const receiverAccount = addresses[4];

      // Check balance and allowance before approving some allowance for foreignerAccount
      const beforeBalanceReceiver = await instance.balanceOf.call(
        receiverAccount,
      );
      const beforeBalanceForeigner = await instance.balanceOf.call(
        foreignerAccount,
      );
      const beforeAllowanceForeigner = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );

      assert.equal(
        0,
        beforeBalanceReceiver.valueOf(),
        `Receiver account doesn't have any tokens`,
      );
      assert.equal(
        0,
        beforeBalanceForeigner.valueOf(),
        `Foreigner account doesn't have any tokens`,
      );
      assert.equal(
        0,
        beforeAllowanceForeigner.valueOf(),
        `Foreigner account doesn't have any allowance tokens`,
      );

      await instance.mint(tokenOwner, 1000, { from: tokenOwner });
      // Allow foreignerAccount to use 1000 tokens from tokenOwner balance
      await instance.approve(foreignerAccount, 1000);

      const afterBalanceForeigner = await instance.balanceOf.call(
        foreignerAccount,
      );
      const afterAllowanceForeigner = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );

      assert.equal(
        0,
        afterBalanceForeigner.valueOf(),
        `Foreigner account doesn't have any tokens`,
      );
      assert.equal(
        1000,
        afterAllowanceForeigner.valueOf(),
        `Foreigner account has 1000 tokens allowance`,
      );

      const beforeOwnerBalance = await instance.balanceOf.call(tokenOwner);

      assert.equal(
        web3.toBigNumber(1000).valueOf(),
        beforeOwnerBalance.valueOf(),
        'Balance owner is 1000',
      );

      // Send 50 tokens from allowance of foreignerAccount
      await instance.transferFrom(tokenOwner, receiverAccount, 50, {
        from: foreignerAccount,
      });

      const balanceOwner = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        web3.toBigNumber(950).valueOf(),
        balanceOwner.valueOf(),
        'Balance of tokenOwner is 950',
      );

      const balanceReceiver = await instance.balanceOf.call(receiverAccount);
      assert.equal(
        50,
        balanceReceiver.valueOf(),
        'Balance of receiverAccount is 50',
      );

      const allowanceForeiger = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        950,
        allowanceForeiger.valueOf(),
        'Allowance of foreignerAccount is 950',
      );
    });

    it('decrease approval', async () => {
      const foreignerAccount = addresses[3];
      const receiverAccount = addresses[4];

      const beforeAllowance = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        0,
        beforeAllowance.valueOf(),
        'Allowance of foreignerAccount is 0',
      );

      // Allow foreignerAccount spend 950 tokens from tokenOwner balance
      await instance.approve(foreignerAccount, 950);

      const updatedAllowance = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        950,
        updatedAllowance.valueOf(),
        'Allowance of foreignerAccount is 950',
      );

      await instance.decreaseApproval(foreignerAccount, 950);

      const allowance = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        0,
        allowance.valueOf(),
        'Allowance of foreignerAccount is 0',
      );
    });

    it('increase approval', async () => {
      const foreignerAccount = addresses[3];
      const receiverAccount = addresses[4];

      const tokenOwnerBalance = await instance.balanceOf.call(tokenOwner);

      assert.equal(
        web3.toBigNumber(0).valueOf(),
        tokenOwnerBalance.valueOf(),
        'Balance of owner is 0',
      );

      const beforeAllowance = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        0,
        beforeAllowance.valueOf(),
        'Allowance of foreignerAccount is 0',
      );

      await instance.increaseApproval(foreignerAccount, 19);

      const allowance = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        19,
        allowance.valueOf(),
        'Allowance of foreignerAccount is 19',
      );
    });
  });

  describe('Burn cases', () => {
    beforeEach(async () => {
      instance = await DateCoin.new(cap, { from: tokenOwner });
    });

    it('burn by owner', async () => {
      const anotherAccount = addresses[2];

      const ownerBalance = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        web3.toBigNumber(0).valueOf(),
        ownerBalance.valueOf(),
        `Balance of tokenOwner is ${cap.valueOf()}`,
      );

      const beforeBalance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        web3.toBigNumber(0).valueOf(),
        beforeBalance.valueOf(),
        'Balance of anotherAccount before minting.',
      );

      await instance.mint(tokenOwner, 10000, { from: tokenOwner });

      await instance.transfer(anotherAccount, 100);

      const balanceOwner = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        web3.toBigNumber(9900).valueOf(),
        balanceOwner.valueOf(),
        'Balance of tokenOwner is 9900',
      );

      let balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        100,
        balance.valueOf(),
        'Balance of anotherAccount after minting is 100',
      );

      // Burn by owner
      await instance.burn(11, { from: anotherAccount });

      balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        89,
        balance.valueOf(),
        'Balance of anotherAccount after minting is 89',
      );
    });
  });

  describe('Lock account', () => {
    const anotherAccount = addresses[2];
    beforeEach(async () => {
      instance = await DateCoin.new(cap, { from: tokenOwner });
      await instance.mint(anotherAccount, 100);
    });

    it('should revert transfer', async () => {
      const releaseTime = latestTime() + duration.weeks(1);
      await instance.lockAccount(anotherAccount, releaseTime);

      await assertRevert(
        instance.transfer(addresses[9], 10, { from: anotherAccount }),
        'Revert transfer of locked account',
      );

      await increaseTimeTo(releaseTime + duration.days(15));

      await instance.transfer(addresses[9], 10, { from: anotherAccount });

      const balance = await instance.balanceOf(anotherAccount);
      assert.equal(
        web3.toBigNumber(90).valueOf(),
        balance,
        'Balance of anotherAccount is 90',
      );
    });

    it('should revert transferFrom', async () => {
      const allowedAccount = addresses[5];
      await instance.approve(allowedAccount, 50, { from: anotherAccount });

      const releaseTime = latestTime() + duration.days(1);
      await instance.lockAccount(anotherAccount, releaseTime);

      await assertRevert(
        instance.transferFrom(anotherAccount, addresses[7], 35, {
          from: allowedAccount,
        }),
        'Revert transfer of locked account',
      );

      await increaseTimeTo(releaseTime + duration.days(5));

      await instance.transferFrom(anotherAccount, addresses[7], 35, {
        from: allowedAccount,
      });

      const balance = await instance.balanceOf(anotherAccount);
      assert.equal(
        web3.toBigNumber(65).valueOf(),
        balance,
        'Balance of anotherAccount is 65',
      );
    });

    it('should revert burn', async () => {
      const releaseTime = latestTime() + duration.years(1);
      await instance.lockAccount(anotherAccount, releaseTime);

      await assertRevert(
        instance.burn(11, { from: anotherAccount }),
        'Burn my own tokens',
      );

      await increaseTimeTo(releaseTime + duration.days(1));

      await instance.burn(11, { from: anotherAccount });

      const balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        89,
        balance.valueOf(),
        'Balance of anotherAccount after burn is 89',
      );
    });

    it('should show true if account is locked', async () => {
      const releaseTime = latestTime() + duration.weeks(1);
      await instance.lockAccount(anotherAccount, releaseTime);

      const result = await instance.isAccountLocked(anotherAccount);

      assert.equal(true, result, 'Account is locked');
    });

    it("should show false if account isn't locked", async () => {
      const result = await instance.isAccountLocked(tokenOwner);
      assert.equal(false, result, "Account isn't locked");
    });
  });

  describe('Production deploy scenario', () => {
    let internalToken = null;
    it('should deploy token', async () => {
      internalToken = await DateCoin.new(cap, { from: tokenOwner });

      assert.notEqual(internalToken, null, 'Token was created');
    });

    it('should mint all tokens to owners', async () => {
      assert.notEqual(internalToken, null, 'Token is ready');
      // 34 892 307
      const team = addresses[1];
      const teamAmount = 34892307;

      // 11 630 769
      const adviser1 = addresses[2];
      const adviser1Amount = 11630769;

      // 11 630 769
      const adviser2 = addresses[3];
      const adviser2Amount = 11630769;

      // 2 907 692
      const bounty = addresses[4];
      const bountyAmount = 2907692;

      // 11 630 769
      const marketing = addresses[5];
      const marketingAmount = 11630769;

      // +29 076 923
      const reserved = addresses[6];
      const reservedAmount = 29076924;

      // 18 000 000
      const preSale = addresses[7];
      const preSaleAmount = 18000000;

      // 171 000 000
      const crowdsale = addresses[8];
      const crowdsaleAmount = 171000000;

      // 189 000 000
      // Total: 290 769 230

      const canMintBefore = await internalToken.mintingFinished.call();
      assert.equal(false, canMintBefore, 'Minting is available');

      await internalToken.mint(team, teamAmount);
      await internalToken.mint(adviser1, adviser1Amount);
      await internalToken.mint(adviser2, adviser2Amount);
      await internalToken.mint(bounty, bountyAmount);
      await internalToken.mint(marketing, marketingAmount);
      await internalToken.mint(reserved, reservedAmount);
      await internalToken.mint(preSale, preSaleAmount);
      await internalToken.mint(crowdsale, crowdsaleAmount);
      await internalToken.finishMinting();

      const yearReleaseTime = latestTime() + duration.years(1);
      const halfYearReleaseTime = latestTime() + duration.months(6);

      await internalToken.lockAccount(team, yearReleaseTime);
      await internalToken.lockAccount(adviser2, halfYearReleaseTime);
      await internalToken.lockAccount(reserved, halfYearReleaseTime);

      const totalSupplied = await internalToken.totalSupply();
      assert.equal(
        totalSupplied.valueOf(),
        web3.toBigNumber(290769230).valueOf(),
        'Total emssion is 290769230',
      );

      const canMintAfter = await internalToken.mintingFinished.call();
      assert.equal(true, canMintAfter, 'Minting is done');
    });
  });
});
