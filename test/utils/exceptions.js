const PREFIX = "Returned error: VM Exception while processing transaction: ";

async function tryCatch(promise, message, reason) {
  try {
    await promise;
    throw null;
  }
  catch (error) {
    // console.log('error', error)
    assert(error, "Expected an error but did not get one");
    assert(error.message.startsWith(PREFIX + message), `Expected an error starting with '${PREFIX} ${message}' but got '${error.message}' instead`);
    if (reason) {
      assert(error.message.includes(reason), `Expected an error with reason: '${reason}' but got '${error.message}' instead`)
    }
  }
};

module.exports = {
  catchRevert: async function(promise) {await tryCatch(promise, "revert");},
  catchRevertWithReason: async function(promise, reason) {await tryCatch(promise, "revert", reason);},
  catchOutOfGas: async function(promise) {await tryCatch(promise, "out of gas");},
  catchInvalidJump: async function(promise) {await tryCatch(promise, "invalid JUMP");},
  catchInvalidOpcode: async function(promise) {await tryCatch(promise, "invalid opcode");},
  catchStackOverflow: async function(promise) {await tryCatch(promise, "stack overflow");},
  catchStackUnderflow: async function(promise) {await tryCatch(promise, "stack underflow");},
  catchStaticStateChange: async function(promise) {await tryCatch(promise, "static state change");},
};
