// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HenkakuToken is ERC20, Ownable {
    uint256 private maxSupply = 1_000_000_000e18; // 1 billion henkaku
    mapping(address => bool) private whitelist;
    address public gateKeeper; // multisig contract address managed by henkaku community
    address public dev; // EOA which updates whitelist systematically like using crontab.
    bool unlock;

    constructor() ERC20("HENKAKU", "HENKAKU") {
        unlock = false;
    }

    function mint(address _to, uint256 amount) public onlyOwner {
        require(maxSupply >= (totalSupply() + amount), "EXCEED MAX SUPPLY");
        _mint(_to, amount);
    }

    function burn(address _of, uint256 amount) public {
        require(
            _of == msg.sender || msg.sender == owner(),
            "INVALID: NOT YOUR ASSET"
        );
        _burn(_of, amount);
    }

    modifier onlyAllowed(address sender) {
        require(whitelist[sender], "INVALID: NOT ALLOWED");
        _;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner() ||
                msg.sender == gateKeeper ||
                msg.sender == dev,
            "INVALID: ONLY ADMIN CAN EXECUTE"
        );
        _;
    }

    function isAllowed(address user) public view onlyOwner returns (bool) {
        return whitelist[user];
    }

    function unLock() public onlyOwner {
        unlock = true;
    }

    function setDevAddress(address user) public onlyOwner {
        dev = user;
    }

    function setGateKeeper(address user) public onlyOwner {
        gateKeeper = user;
    }

    function addWhitelistUsers(address[] memory users) public onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            addWhitelistUser(users[i]);
        }
    }

    function addWhitelistUser(address user) public onlyAdmin {
        whitelist[user] = true;
    }

    function removeWhitelistUsers(address[] memory users) public onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            removeWhitelistUser(users[i]);
        }
    }

    function removeWhitelistUser(address user) public onlyAdmin {
        whitelist[user] = false;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(
            whitelist[from] || unlock || from == address(0),
            "INVALID: SENDER IS NOT ALLOWED"
        );
        require(
            whitelist[to] || unlock || from == address(0),
            "INVALID: RECEIVER IS NOT ALLOWED"
        );
    }
}
