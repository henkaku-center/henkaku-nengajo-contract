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
        _checkHenkakuV2Balance(_amount);
        bool sent = IHenkakuToken(henkakuV2).transferFrom(msg.sender, _to, _amount);
        require(sent, "Ticket: Henkaku transfer failed");
    }

    function batchTransferHenkakuV2(uint256 totalPrice, uint256[] memory _amounts, address[] memory _to) internal {
        _checkHenkakuV2Balance(totalPrice);

        uint256[] memory amounts = _amounts;
        uint256 amountsLength = amounts.length;
        require(amountsLength == _to.length, "amounts and to length mismatch");

        for (uint256 i = 0; i < amountsLength; ) {
            bool sent = IHenkakuToken(henkakuV2).transferFrom(msg.sender, _to[i], amounts[i]);
            require(sent, "Ticket: Henkaku transfer failed");

            unchecked {
                ++i;
            }
        }
    }

    function _checkHenkakuV2Balance(uint256 _requiredAmount) internal view {
        require(
            IHenkakuToken(henkakuV2).balanceOf(msg.sender) >= _requiredAmount,
            "Ticket: Insufficient HenkakuV2 token"
        );
    }
}
