import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

var DateCoin = artifacts.require('DateCoin');

contract('DateCoin', addresses => {
  const zeroAddress = '0x0';
  const tokenOwner = addresses[0];

  before(async () => await advanceBlock());

  it('check owner', async () => {
    const instance = await DateCoin.new({ from: tokenOwner });
    const owner = await instance.owner();
    assert.equal(tokenOwner, owner, 'Owner contract is ' + owner);
  });

  it('check token params', async () => {
    const instance = await DateCoin.new({ from: tokenOwner });
    const name = await instance.name.call();
    const symbol = await instance.symbol.call();
    const decimals = await instance.decimals.call();

    assert.equal('DateCoin ICO Token', name, 'Token name');
    assert.equal('DTC', symbol, 'Token symbol');
    assert.equal(18, decimals, 'Token decimals');
  });

  it('send tokens from owner to another account', async () => {
    const instance = await DateCoin.new({ from: tokenOwner });
    const anotherAccount = addresses[2];

    await instance.mint(tokenOwner, 1000);

    const ownerBalance = await instance.balanceOf.call(tokenOwner);
    assert.equal(
      1000,
      ownerBalance.valueOf(),
      `Balance of ${tokenOwner} is 1000`,
    );

    const beforeBalance = await instance.balanceOf.call(anotherAccount);
    assert.equal(
      0,
      beforeBalance.valueOf(),
      `Balance of ${anotherAccount} before minting.`,
    );

    await instance.transfer(anotherAccount, 100);

    const balanceOwner = await instance.balanceOf.call(tokenOwner);
    assert.equal(900, balanceOwner.valueOf(), `Balance of tokenOwner is 900`);

    const balance = await instance.balanceOf.call(anotherAccount);
    assert.equal(
      100,
      balance.valueOf(),
      `Balance of ${anotherAccount} after minting is 100`,
    );

    await instance.transfer(tokenOwner, 9, { from: anotherAccount });

    const afterSendBalance = await instance.balanceOf.call(anotherAccount);
    assert.equal(
      91,
      afterSendBalance.valueOf(),
      `Balance of ${anotherAccount} after minting is 91`,
    );
  });

  it('transfer ownership', async () => {
    const instance = await DateCoin.new({ from: tokenOwner });
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

  it('finish minting', async () => {
    const instance = await DateCoin.new({ from: tokenOwner });
    const agent = addresses[5];

    let finished = await instance.mintingFinished.call();
    assert.equal(false, finished, "Minting isn't finished");

    await instance.finishMinting();

    finished = await instance.mintingFinished.call();
    assert.equal(true, finished, 'Minting is finished');
  });

  it('total supply', async () => {
    const instance = await DateCoin.new({ from: tokenOwner });
    const investor = addresses[1];
    const tokenCount = 1952;

    const beforeTotalSupply = await instance.totalSupply.call();
    assert.equal(0, beforeTotalSupply.valueOf(), 'Total supply is 0');

    // Mint some tokens for investor
    await instance.mint(investor, tokenCount);

    const totalSupply = await instance.totalSupply.call();
    assert.equal(
      tokenCount,
      totalSupply.valueOf(),
      `Total supply is ${tokenCount}`,
    );
  });

  describe('Mint cases', () => {
    it('mint tokens for owner', async () => {
      const instance = await DateCoin.new({ from: tokenOwner });
      const beforeBalance = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        0,
        beforeBalance.valueOf(),
        `Balance of ${tokenOwner} before minting.`,
      );

      const finished = await instance.mintingFinished.call();

      assert.equal(true, !finished, "Minting isn't finished");

      await instance.mint(tokenOwner, 10000);
      const balance = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        10000,
        balance.valueOf(),
        `Balance of ${tokenOwner} after minting is 10000`,
      );
    });

    it('mint tokens for another account', async () => {
      const instance = await DateCoin.new({ from: tokenOwner });
      const anotherAccount = addresses[1];
      const beforeBalance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        0,
        beforeBalance.valueOf(),
        `Balance of ${anotherAccount} before minting.`,
      );

      await instance.mint(anotherAccount, 500);
      const balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        500,
        balance.valueOf(),
        `Balance of ${anotherAccount} after minting is 500`,
      );
    });

    it('mint from frezon wallet', async () => {
      const startTime = latestTime() + duration.weeks(1);
      const freezingDate = startTime + duration.years(2);
      const afterFreezingDate = freezingDate + duration.days(1);

      await increaseTimeTo(startTime);

      const instance = await DateCoin.new({ from: tokenOwner });
      const frozenWallet = addresses[9];
      const to = addresses[8];

      const beforeTotalSupply = await instance.totalSupply.call();
      assert.equal(0, beforeTotalSupply.valueOf(), 'Total supply is 0');

      // Mint some tokens for investor
      await instance.mint(frozenWallet, 100);
      await instance.setFrozenWallet(frozenWallet);
      await instance.setFreezingDate(freezingDate);

      const _frozenWallet = await instance.frozenWallet.call();
      const _freezingDate = await instance.freezingDate.call();

      assert.equal(_frozenWallet, frozenWallet, 'Frozen wallet was set');
      assert.equal(_freezingDate, freezingDate, 'Freezing date was set');

      const beforeBalance = await instance.balanceOf.call(frozenWallet);
      assert.equal(
        beforeBalance.valueOf(),
        '100',
        'Before transfering is 100 DTC',
      );

      // Try to transfer before unlock date
      await instance.transfer(to, 10, { from: frozenWallet });

      const afterBalance = await instance.balanceOf.call(frozenWallet);
      assert.equal(
        afterBalance.valueOf(),
        '100',
        'After transfering is 100 DTC',
      );

      await increaseTimeTo(afterFreezingDate);

      // Try to transfer after unlock date
      await instance.transfer(to, 10, { from: frozenWallet });

      const reducedBalance = await instance.balanceOf.call(frozenWallet);
      assert.equal(reducedBalance.valueOf(), '90', '10 DTC must be transfered');
    });
  });

  describe('Allowance cases', () => {
    it('approve transfering for sender', async () => {
      const instance = await DateCoin.new({ from: tokenOwner });
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

      await instance.mint(tokenOwner, 9900);

      const beforeOwnerBalance = await instance.balanceOf.call(tokenOwner);

      assert.equal(9900, beforeOwnerBalance.valueOf(), 'Balance owner is 9900');

      // Send 50 tokens from allowance of foreignerAccount
      await instance.transferFrom(tokenOwner, receiverAccount, 50, {
        from: foreignerAccount,
      });

      const balanceOwner = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        9850,
        balanceOwner.valueOf(),
        `Balance of tokenOwner is 9850`,
      );

      const balanceReceiver = await instance.balanceOf.call(receiverAccount);
      assert.equal(
        50,
        balanceReceiver.valueOf(),
        `Balance of receiverAccount is 50`,
      );

      const allowanceForeiger = await instance.allowance.call(
        tokenOwner,
        foreignerAccount,
      );
      assert.equal(
        950,
        allowanceForeiger.valueOf(),
        `Allowance of foreignerAccount is 950`,
      );
    });

    it('decrease approval', async () => {
      const instance = await DateCoin.new({ from: tokenOwner });
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
      const instance = await DateCoin.new({ from: tokenOwner });
      const foreignerAccount = addresses[3];
      const receiverAccount = addresses[4];

      const tokenOwnerBalance = await instance.balanceOf.call(tokenOwner);

      assert.equal(0, tokenOwnerBalance.valueOf(), 'Balance of owner is 0');

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
    it('burn by owner', async () => {
      const instance = await DateCoin.new({ from: tokenOwner });
      const anotherAccount = addresses[2];

      await instance.mint(tokenOwner, 1000);

      const ownerBalance = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        1000,
        ownerBalance.valueOf(),
        `Balance of ${tokenOwner} is 1000`,
      );

      const beforeBalance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        0,
        beforeBalance.valueOf(),
        `Balance of ${anotherAccount} before minting.`,
      );

      await instance.transfer(anotherAccount, 100);

      const balanceOwner = await instance.balanceOf.call(tokenOwner);
      assert.equal(900, balanceOwner.valueOf(), `Balance of tokenOwner is 900`);

      let balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        100,
        balance.valueOf(),
        `Balance of ${anotherAccount} after minting is 100`,
      );

      // Burn by owner
      await instance.burn(11, { from: anotherAccount });

      balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        89,
        balance.valueOf(),
        `Balance of ${anotherAccount} after minting is 89`,
      );
    });

    it('burn by contract', async () => {
      const instance = await DateCoin.new({ from: tokenOwner });
      const anotherAccount = addresses[2];

      await instance.mint(tokenOwner, 1000);

      const ownerBalance = await instance.balanceOf.call(tokenOwner);
      assert.equal(
        1000,
        ownerBalance.valueOf(),
        `Balance of ${tokenOwner} is 1000`,
      );

      const beforeBalance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        0,
        beforeBalance.valueOf(),
        `Balance of ${anotherAccount} before minting.`,
      );

      await instance.transfer(anotherAccount, 100);

      const balanceOwner = await instance.balanceOf.call(tokenOwner);
      assert.equal(900, balanceOwner.valueOf(), `Balance of tokenOwner is 900`);

      let balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        100,
        balance.valueOf(),
        `Balance of ${anotherAccount} after minting is 100`,
      );

      // Burn by owner
      await instance.burnFrom(anotherAccount, 29);

      balance = await instance.balanceOf.call(anotherAccount);
      assert.equal(
        71,
        balance.valueOf(),
        `Balance of ${anotherAccount} after minting is 71`,
      );
    });
  });
});
