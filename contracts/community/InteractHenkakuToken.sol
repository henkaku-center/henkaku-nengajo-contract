// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../libs/AdministrationUpgradeable.sol";
import "../libs/MintManager.sol";
import "./interfaces/IHenkakuToken.sol";

abstract contract InteractHenakuToken is Initializable, AdministrationUpgradeable, MintManager {
    address public henkakuV2;
    address public henkakuPoolWallet;

    function __InteractHenakuToken_init(address _henkakuV2, address _henkakuPoolWallet) internal onlyInitializing {
        henkakuV2 = _henkakuV2;
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
