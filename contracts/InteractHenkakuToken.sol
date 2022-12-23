// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./MintManager.sol";
import "./interfaces/IHenkakuToken.sol";

abstract contract InteractHenakuToken is MintManager {
    address public henkakuV2;
    address public henkakuPoolWallet;

    constructor(address _henkakuV2, address _henkakuPoolWallet) {
        henkakuV2 = _henkakuV2;
        // @note henkakuPoolWalletは変更の可能性はないか？
        henkakuPoolWallet = _henkakuPoolWallet;
    }

    function transferHenkakuV2(uint256 _amount) internal {
        require(checkHenkakuV2Balance(_amount), "Nengajo: Insufficient HenkakuV2 token");
        bool sent = IHenkakuToken(henkakuV2).transferFrom(msg.sender, henkakuPoolWallet, _amount);
        require(sent, "Nengajo: Henkaku transfer failed");
    }

    function checkHenkakuV2Balance(uint256 _requiredAmount) internal view returns (bool) {
        return IHenkakuToken(henkakuV2).balanceOf(msg.sender) >= _requiredAmount ? true : false;
    }

    function changeHenkakuPool(address _address) external onlyAdmins {
        require(henkakuPoolWallet != _address, "Henkaku Pool: same address");
        henkakuPoolWallet = _address;
    }
}
