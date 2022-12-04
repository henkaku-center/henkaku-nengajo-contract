// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/IHenkakuToken.sol";

abstract contract InteractHenakuToken {
    address internal henkakuV2;
    address internal henkakuPoolWallet;

    constructor(address _henkakuV2, address _henkakuPoolWallet) {
        henkakuV2 = _henkakuV2;
        henkakuPoolWallet = _henkakuPoolWallet;
    }

    function transferHenkakuV2(uint256 _amount) internal {
        require(checkHenkakuV2Balance(_amount), "Nengajo: Insufficient HenkakuV2 token");
        bool sent = IHenkakuToken(henkakuV2).transferFrom(msg.sender, henkakuPoolWallet, _amount);
        require(sent, "transferFrom failed");
    }

    function checkHenkakuV2Balance(uint256 _requiredAmount) internal view returns (bool) {
        if (IHenkakuToken(henkakuV2).balanceOf(msg.sender) >= _requiredAmount) {
            return true;
        } else {
            return false;
        }
    }
}
