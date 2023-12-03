// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Administration.sol";

abstract contract MintManager is Administration {
    bool public mintable;
    uint256 public immutable open_blockTimestamp;
    uint256 public immutable close_blockTimestamp;

    constructor(uint256 _open_blockTimestamp, uint256 _close_blockTimestamp) {
        open_blockTimestamp = _open_blockTimestamp;
        close_blockTimestamp = _close_blockTimestamp;
    }

    function switchMintable() external onlyAdmins {
        mintable = !mintable;
    }

    function checkRemainingOpenTime() external view returns (uint256) {
        uint256 _open_blockTimestamp = open_blockTimestamp;
        return _open_blockTimestamp > block.timestamp ? _open_blockTimestamp - block.timestamp : 0;
    }

    function checkRemainingCloseTime() external view returns (uint256) {
        uint256 _close_blockTimestamp = close_blockTimestamp;
        return _close_blockTimestamp > block.timestamp ? _close_blockTimestamp - block.timestamp : 0;
    }
}
