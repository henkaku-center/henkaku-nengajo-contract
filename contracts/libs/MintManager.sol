// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./AdministrationUpgradeable.sol";

abstract contract MintManager is Initializable, AdministrationUpgradeable {
    bool public mintable;
    uint256 public open_blockTimestamp;
    uint256 public close_blockTimestamp;

    function __MintManager_init(uint256 _open_blockTimestamp, uint256 _close_blockTimestamp) internal onlyInitializing {
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
