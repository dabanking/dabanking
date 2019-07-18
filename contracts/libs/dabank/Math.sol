pragma solidity 0.4.25;

library Math {
  function abs(int number) internal pure returns (uint) {
    if (number < 0) {
      return uint(number * -1);
    }
    return uint(number);
  }
}
