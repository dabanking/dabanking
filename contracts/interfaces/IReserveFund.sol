pragma solidity 0.4.25;

interface IReserveFund {

  function getLockedStatus(address _investor) view external returns (uint8);

  function getTransferDifficulty() view external returns (uint);
}
