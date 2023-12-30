// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IHenkaku1155Mint is IERC1155 {
    function mint(address _to) external;
}