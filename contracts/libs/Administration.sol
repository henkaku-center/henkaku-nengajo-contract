// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Administration {
    mapping(address => bool) private _admins;

    constructor() {
        _admins[msg.sender] = true;
    }

    modifier onlyAdmins() {
        require(_admins[msg.sender], "Admins only");
        _;
    }

    function isAdmin(address _address) public view returns (bool) {
        return _admins[_address];
    }

    function addAdmins(address[] memory _newAdmins) external onlyAdmins {
        uint256 _newAdminsLength = _newAdmins.length;
        require(_newAdminsLength > 0, "Need one or more new admins");

        for (uint256 i = 0; i < _newAdminsLength; ) {
            address _newAdmin = _newAdmins[i];
            if (!_admins[_newAdmin]) {
                _admins[_newAdmin] = true;
            }
            unchecked {
                ++i;
            }
        }
    }

    function deleteAdmin(address _deleteAdmin) external onlyAdmins {
        _admins[_deleteAdmin] = false;
    }
}