pragma solidity 0.4.25;

import "truffle/Assert.sol";
import '../contracts/libs/dabank/ArrayUtil.sol';

contract TestArray {

  function testTooLargestValues() public {
    uint max;
    uint subMax;
    uint[] memory testArray = new uint[](6);
    testArray[0] = 10;
    testArray[1] = 42;
    (max, subMax) = ArrayUtil.tooLargestValues(testArray);
    Assert.equal(max, 42, "max");
    Assert.equal(subMax, 10, "subMax");

    testArray[2] = 36;
    testArray[3] = 18;
    testArray[4] = 69;
    (max, subMax) = ArrayUtil.tooLargestValues(testArray);
    Assert.equal(max, 69, "max");
    Assert.equal(subMax, 42, "subMax");

    testArray[5] = 69;
    (max, subMax) = ArrayUtil.tooLargestValues(testArray);
    Assert.equal(max, 69, "max");
    Assert.equal(subMax, 69, "subMax");
  }
}
