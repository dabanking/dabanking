pragma solidity 0.4.25;

library ArrayUtil {

  function tooLargestValues(uint[] array) internal pure returns (uint max, uint subMax) {
    require(array.length >= 2, "Invalid array length");
    max = array[0];
    for (uint i = 1; i < array.length; i++) {
      if (array[i] > max) {
        subMax = max;
        max = array[i];
      } else if (array[i] > subMax) {
        subMax = array[i];
      }
    }
  }
}
