pragma solidity 0.4.25;

import './libs/zeppelin/token/ERC20/ERC20.sol';

contract DABANKING is ERC20 {
  string public constant name = 'DABANKING';
  string public constant symbol = 'DAB';
  uint8 public constant decimals = 18;
  uint256 public constant totalSupply = (200 * 1e6) * (10 ** uint256(decimals));

  constructor(address _daBank) public {
    _balances[_daBank] = totalSupply;
    emit Transfer(address(0x0), _daBank, totalSupply);
  }
}

