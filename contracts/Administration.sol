// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Administration {
    mapping(address => bool) public admins;

    constructor() {
        admins[msg.sender] = true;
    }

    modifier onlyAdmins() {
        require(admins[msg.sender], "Admins only");
        _;
    }

    function addAdmins(address[] memory _newAdmins) external onlyAdmins {
        uint256 _newAdminsLength = _newAdmins.length;
        require(_newAdminsLength > 0, "Need one or more new admins");

        for (uint256 i = 0; i < _newAdminsLength; ) {
            address _newAdmin = _newAdmins[i];
            if (!admins[_newAdmin]) {
                admins[_newAdmin] = true;
            }
            unchecked {
                ++i;
            }
        }
    }

    function deleteAdmin(address _deleteAdmin) external onlyAdmins {
        admins[_deleteAdmin] = false;
    }
}