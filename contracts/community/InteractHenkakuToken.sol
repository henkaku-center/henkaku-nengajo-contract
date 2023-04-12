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

    function batchTransferHenkakuV2(uint256[] memory _amounts, address[] memory _to) internal {
        uint256[] memory amounts = _amounts;
        uint256 amountsLength = amounts.length;
        require(amountsLength == _to.length, "amounts and to length mismatch");

        for (uint256 i = 0; i < amountsLength; ) {
            uint256 amount = amounts[i];

            require(checkHenkakuV2Balance(amount), "Ticket: Insufficient HenkakuV2 token");
            bool sent = IHenkakuToken(henkakuV2).transferFrom(msg.sender, _to[i], amount);
            require(sent, "Ticket: Henkaku transfer failed");

            unchecked {
                ++i;
            }
        }
    }

    function checkHenkakuV2Balance(uint256 _requiredAmount) internal view returns (bool) {
        return IHenkakuToken(henkakuV2).balanceOf(msg.sender) >= _requiredAmount ? true : false;
    }
}
