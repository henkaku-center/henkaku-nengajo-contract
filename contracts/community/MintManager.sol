// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Administration.sol";

abstract contract MintManager is Administration {
    bool public mintable;

    constructor() {}

    function switchMintable() external onlyAdmins {
        mintable = !mintable;
    }
}
