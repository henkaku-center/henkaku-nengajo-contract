// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Administration.sol";
import "./MintManager.sol";
import "./interfaces/IHenkakuToken.sol";

abstract contract InteractHenakuToken is Administration, MintManager {
    address public henkakuV2;

    constructor(address _henkakuV2) {
        henkakuV2 = _henkakuV2;
    }

    function transferHenkakuV2(uint256 _amount, address _to) internal {
        require(checkHenkakuV2Balance(_amount), "Ticket: Insufficient HenkakuV2 token");
        bool sent = IHenkakuToken(henkakuV2).transferFrom(msg.sender, _to, _amount);
        require(sent, "Ticket: Henkaku transfer failed");
    }

    function checkHenkakuV2Balance(uint256 _requiredAmount) internal view returns (bool) {
        return IHenkakuToken(henkakuV2).balanceOf(msg.sender) >= _requiredAmount ? true : false;
    }
}
