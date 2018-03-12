export default async (promise, message) => {
  try {
    await promise;
    assert.fail(message);
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};
