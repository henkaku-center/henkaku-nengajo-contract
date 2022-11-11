// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract MintManager {
    bool public mintable;
    uint256 public immutable open_blockTimestamp;
    uint256 public immutable close_blockTimestamp;

    mapping(address => bool) public admins;

    constructor(uint256 _open_blockTimestamp, uint256 _close_blockTimestamp) {
        admins[msg.sender] = true;
        open_blockTimestamp = _open_blockTimestamp;
        close_blockTimestamp = _close_blockTimestamp;
    }

    modifier onlyAdmins() {
        require(admins[msg.sender], "Admins only");
        _;
    }

    function addAdmins(address[] memory _newAdmins) external onlyAdmins {
        uint256 _newAdminsLength = _newAdmins.length;
        require(_newAdminsLength > 0, "Need one or more new admins");

        if (_newAdminsLength == 1 && !admins[_newAdmins[0]]) {
            admins[_newAdmins[0]] = true;
        } else {
            for (uint256 i = 0; i < _newAdminsLength; ++i) {
                if (!admins[_newAdmins[i]]) {
                    admins[_newAdmins[i]] = true;
                }
            }
        }
    }

    function switchMintable() external onlyAdmins {
        mintable = !mintable;
    }

    function checkRemainingOpenTime() external view returns (uint256) {
        if (open_blockTimestamp > block.timestamp) {
            return open_blockTimestamp - block.timestamp;
        } else {
            return 0;
        }
    }

    function checkRemainingCloseTime() external view returns (uint256) {
        if (close_blockTimestamp > block.timestamp) {
            return close_blockTimestamp - block.timestamp;
        } else {
            return 0;
        }
    }
}
