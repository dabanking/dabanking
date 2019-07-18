pragma solidity 0.4.25;

import "truffle/Assert.sol";
import '../contracts/libs/dabank/Math.sol';

contract TestMath {

  function testGetAbs() public {
    Assert.equal(Math.abs(0), 0, "valid");
    Assert.equal(Math.abs(1), 1, "valid");
    Assert.equal(Math.abs(1 + 2), 3, "valid");
    Assert.equal(Math.abs(2 ** 255 - 1), 2 ** 255 - 1, "valid");
    Assert.equal(Math.abs(-1), 1, "valid");
    Assert.equal(Math.abs(1 - 2), 1, "valid");
    Assert.equal(Math.abs(-1 * (2 ** 255 - 1)), 2 ** 255 - 1, "valid");
  }
}
