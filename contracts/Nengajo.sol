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

    // Nengajo Minter's info
    //addressがkey、uintがvalue、mintedNengajoListは格納する変数
    mapping(address => uint256[]) public mintedNengajoList;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _open_blockTimestamp,
        uint256 _close_blockTimestamp,
        address _henkakuTokenV2,
        address _henkakuPoolWallet
    ) ERC1155("") MintManager(_open_blockTimestamp, _close_blockTimestamp) InteractHenakuToken(_henkakuTokenV2, _henkakuPoolWallet) {
        name = _name;
        symbol = _symbol;
    }

    function registerCreative(uint256 _maxSupply, string memory _metaDataURL)
        public
    {
        transferHenkakuV2(_maxSupply * 10);
        registeredNengajos.push(
            NengajoInfo(_metaDataURL, msg.sender, _maxSupply)
        );
        _tokenIds.increment();
    }

    // @return all registered nangajo
    function getAllRegisteredNengajos()
        external
        view
        returns (NengajoInfo[] memory)
    {
        return registeredNengajos;
    }

    // @return registered nengajo data
    function getRegisteredNengajo(uint256 _tokenId)
        public
        view
        returns (NengajoInfo memory)
    {
        require(registeredNengajos.length > _tokenId, "Nengajo: not available");
        return registeredNengajos[_tokenId];
    }

    // @dev mint function
    function mint(uint256 _tokenId) public {
        require(
            (block.timestamp > open_blockTimestamp &&
                close_blockTimestamp > block.timestamp) || mintable,
            "Nengajo: Not mintable"
        );
        require(checkHenkakuV2Balance(1), "Nengajo: Insufficient Henkaku Token Balance");
        require(balanceOf(msg.sender, _tokenId) == 0, "Nengajo: You already have this nengajo");
        require(
            getRegisteredNengajo(_tokenId).maxSupply > totalSupply(_tokenId),
            "Nengajo: Mint limit reached"
        );
        _mint(msg.sender, _tokenId, 1, "");

        // ミントした_tokenIdsを保存する
        mintedNengajoList[msg.sender].push(_tokenId);
    }

    // @return token metadata uri
    function uri(uint256 _tokenId)
        public
        view
        override(ERC1155)
        returns (string memory)
    {
        return getRegisteredNengajo(_tokenId).uri;
    }

    // @return holding tokenIds with address
    function retrieveMintedNengajo()
        public
        view
        returns (uint256[] memory)
    {
        return mintedNengajoList[msg.sender];
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
