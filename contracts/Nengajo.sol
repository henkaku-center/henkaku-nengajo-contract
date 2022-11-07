// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Nengajo is ERC1155, ERC1155Supply, ERC1155URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public name;
    string public symbol;
    bool public mintable;

    mapping(uint256 => uint256) private maxSupply;
    mapping(address => bool) public admins;

    constructor(string memory _name, string memory _symbol) ERC1155("") {
        name = _name;
        symbol = _symbol;
        admins[msg.sender] = true;
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

    function registerCreative(uint256 _maxSupply, string memory _metaDataURL)
        public
    {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _setURI(tokenId, _metaDataURL);
        maxSupply[tokenId] = _maxSupply;
    }

    function mint(uint256 _tokenId) public {
        require(mintable, "not mintable");
        uint256 currentSupply = totalSupply(_tokenId);
        require(maxSupply[_tokenId] > currentSupply, "not available");
        _mint(msg.sender, _tokenId, 1, "");
    }

    function uri(uint256 _tokenId)
        public
        view
        override(ERC1155, ERC1155URIStorage)
        returns (string memory)
    {
        return ERC1155URIStorage.uri(_tokenId);
    }

    function _beforeTokenTransfer(
        address _operator,
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        ERC1155Supply._beforeTokenTransfer(
            _operator,
            _from,
            _to,
            _ids,
            _amounts,
            _data
        );
    }
}
