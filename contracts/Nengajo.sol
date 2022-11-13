// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MintManager.sol";

contract Nengajo is ERC1155, ERC1155Supply, MintManager {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public name;
    string public symbol;

    struct NengajoInfo {
        string uri;
        address creator;
        uint256 maxSupply;
    }

    NengajoInfo[] private registeredNengajos;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _open_blockTimestamp,
        uint256 _close_blockTimestamp
    ) ERC1155("") MintManager(_open_blockTimestamp, _close_blockTimestamp) {
        name = _name;
        symbol = _symbol;
    }

    function registerCreative(uint256 _maxSupply, string memory _metaDataURL)
        public
    {
        registeredNengajos.push(
            NengajoInfo(_metaDataURL, msg.sender, _maxSupply)
        );
        _tokenIds.increment();
    }

    function getAllRegisteredNengajos()
        external
        view
        returns (NengajoInfo[] memory)
    {
        return registeredNengajos;
    }

    function getRegisteredNengajo(uint256 _tokenId)
        public
        view
        returns (NengajoInfo memory)
    {
        require(registeredNengajos.length > _tokenId, "not available");
        return registeredNengajos[_tokenId];
    }

    function mint(uint256 _tokenId) public {
        require(
            (block.timestamp > open_blockTimestamp &&
                close_blockTimestamp > block.timestamp) || mintable,
            "not minting time and not mintable"
        );
        uint256 currentSupply = totalSupply(_tokenId);
        require(
            getRegisteredNengajo(_tokenId).maxSupply > currentSupply,
            "mint limit reached"
        );
        _mint(msg.sender, _tokenId, 1, "");
    }

    function uri(uint256 _tokenId)
        public
        view
        override(ERC1155)
        returns (string memory)
    {
        return getRegisteredNengajo(_tokenId).uri;
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
