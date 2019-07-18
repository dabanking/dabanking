pragma solidity 0.4.25;

import "truffle/Assert.sol";
import '../contracts/libs/dabank/StringUtil.sol';

contract TestStringUtil {
  using StringUtil for *;

  function testValidateUserName() public {
    Assert.equal("123".validateUserName(), false, "invalid");
    Assert.equal("123456789123456789123456789".validateUserName(), false, "invalid");
    Assert.equal("Abcd".validateUserName(), false, "invalid");
    Assert.equal("0ABCD".validateUserName(), false, "invalid");
    Assert.equal("AB CD".validateUserName(), false, "invalid");
    string memory validUserName = "ABCD123";
    Assert.equal(validUserName.validateUserName(), true, "valid");
  }
}
