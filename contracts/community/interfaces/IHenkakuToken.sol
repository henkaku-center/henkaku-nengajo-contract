// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IHenkakuToken {
  function addWhitelistUser ( address user ) external;
  function addWhitelistUsers ( address[] memory users ) external;
  function allowance ( address owner, address spender ) external view returns ( uint256 );
  function approve ( address spender, uint256 amount ) external returns ( bool );
  function balanceOf ( address account ) external view returns ( uint256 );
  function burn ( address _of, uint256 amount ) external;
  function decimals (  ) external view returns ( uint8 );
  function decreaseAllowance ( address spender, uint256 subtractedValue ) external returns ( bool );
  function dev (  ) external view returns ( address );
  function gateKeeper (  ) external view returns ( address );
  function increaseAllowance ( address spender, uint256 addedValue ) external returns ( bool );
  function isAllowed ( address user ) external view returns ( bool );
  function mint ( address _to, uint256 amount ) external;
  function name (  ) external view returns ( string memory );
  function owner (  ) external view returns ( address );
  function removeWhitelistUser ( address user ) external;
  function removeWhitelistUsers ( address[] memory users ) external;
  function renounceOwnership (  ) external;
  function setDevAddress ( address user ) external;
  function setGateKeeper ( address user ) external;
  function symbol (  ) external view returns ( string memory );
  function totalSupply (  ) external view returns ( uint256 );
  function transfer ( address to, uint256 amount ) external returns ( bool );
  function transferFrom ( address from, address to, uint256 amount ) external returns ( bool );
  function transferOwnership ( address newOwner ) external;
  function unLock (  ) external;
}
