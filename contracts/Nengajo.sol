// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MintManager.sol";
import "./InteractHenkakuToken.sol";

contract Nengajo is ERC1155, ERC1155Supply, MintManager, InteractHenakuToken {
    //@dev count up tokenId from 0
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public name;
    string public symbol;

    /**
     * @param uri: metadata uri
     * @param creator: creator's wallet address
     * @param maxSupply: max supply number of token
     */
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
        uint256 _close_blockTimestamp,
        address _henkakuTokenV2,
        address _henkakuPoolWallet
    )
        ERC1155("")
        MintManager(_open_blockTimestamp, _close_blockTimestamp)
        InteractHenakuToken(_henkakuTokenV2, _henkakuPoolWallet)
    {
        name = _name;
        symbol = _symbol;

        registeredNengajos.push(NengajoInfo("", address(0), 0));
        _tokenIds.increment();
    }

    modifier whenMintable() {
        require(
            (block.timestamp > open_blockTimestamp && close_blockTimestamp > block.timestamp) || mintable,
            "Nengajo: Not mintable"
        );
        require(checkHenkakuV2Balance(1), "Nengajo: Insufficient Henkaku Token Balance");
        _;
    }

    function registerCreative(uint256 _maxSupply, string memory _metaDataURL) public {
        transferHenkakuV2(_maxSupply * 10);
        registeredNengajos.push(NengajoInfo(_metaDataURL, msg.sender, _maxSupply));
        _tokenIds.increment();
    }

    // @return all registered nangajo
    function getAllRegisteredNengajos() external view returns (NengajoInfo[] memory) {
        return registeredNengajos;
    }

    // @return registered nengajo data
    function getRegisteredNengajo(uint256 _tokenId) public view returns (NengajoInfo memory) {
        require(registeredNengajos.length > _tokenId, "Nengajo: not available");
        return registeredNengajos[_tokenId];
    }

    function checkNengajoAmount(uint256 _tokenId) private view {
        require(balanceOf(msg.sender, _tokenId) == 0, "Nengajo: You already have this nengajo");

        require(getRegisteredNengajo(_tokenId).maxSupply > totalSupply(_tokenId), "Nengajo: Mint limit reached");
    }

    // @dev mint function
    function mintBatch(uint256[] memory _tokenIdsList) public whenMintable {
        uint256 tokenIdsLength = _tokenIdsList.length;
        uint256[] memory amountList = new uint256[](tokenIdsLength);

        for (uint256 i = 0; i < tokenIdsLength; ++i) {
            checkNengajoAmount(_tokenIdsList[i]);
            amountList[i] = 1;
        }

        _mintBatch(msg.sender, _tokenIdsList, amountList, "");
    }

    // @dev mint function
    function mint(uint256 _tokenId) public whenMintable {
        checkNengajoAmount(_tokenId);
        _mint(msg.sender, _tokenId, 1, "");
    }

    // @return token metadata uri
    function uri(uint256 _tokenId) public view override(ERC1155) returns (string memory) {
        return getRegisteredNengajo(_tokenId).uri;
    }

    // @return holding tokenIds with address
    function retrieveMintedNengajoIds() public view returns (uint256[] memory) {
        uint256 totalTokenIds = _tokenIds.current();
        uint256[] memory mintedNengajo = new uint256[](totalTokenIds);
        uint256 mintedNengajoLength;

        for (uint256 i = 0; i < totalTokenIds; ++i) {
            if (balanceOf(msg.sender, i) != 0) {
                mintedNengajo[mintedNengajoLength] = i;
                ++mintedNengajoLength;
            }
        }

        uint256[] memory mintedNengajoIds_ = new uint256[](mintedNengajoLength);
        for (uint256 j = 0; j < mintedNengajoLength; ++j) {
            mintedNengajoIds_[j] = mintedNengajo[j];
        }

        return mintedNengajoIds_;
    }

    function _beforeTokenTransfer(
        address _operator,
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        ERC1155Supply._beforeTokenTransfer(_operator, _from, _to, _ids, _amounts, _data);
    }
}
