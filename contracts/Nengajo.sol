// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MintManager.sol";
import "./InteractHenkakuToken.sol";
import "hardhat/console.sol";

contract Nengajo is ERC1155, ERC1155Supply, MintManager, InteractHenakuToken {
    //@dev count up tokenId from 0
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public name;
    string public symbol;

    mapping(address => uint256[]) private ownerOfRegisteredIds;
    mapping(address => uint256[]) private ownerOfMintedIds;

    //@dev Declare Event to emit
    event RegisterNengajo(address indexed creator, uint256 tokenId, string metaDataURL, uint256 maxSupply);
    event Mint(address indexed minter, uint256 indexed tokenId);
    event MintBatch(address indexed minter, uint256[] tokenIds);

    /**
     * @param uri: metadata uri
     * @param creator: creator's wallet address
     * @param maxSupply: max supply number of token
     */
    struct NengajoInfo {
        uint256 id;
        string uri;
        address creator;
        uint256 maxSupply;
    }

    NengajoInfo[] private registeredNengajoes;

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

        registeredNengajoes.push(NengajoInfo(0, "", address(0), 0));
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

    function registerNengajo(uint256 _maxSupply, string memory _metaDataURL) public {
        require(_maxSupply != 0 || keccak256(bytes(_metaDataURL)) != keccak256(bytes("")), "Nengajo: invalid params");
        NengajoInfo[] memory _registeredNengajoes = registeredNengajoes;
        uint256[] memory _ownerOfRegisteredIds = ownerOfRegisteredIds[msg.sender];
        uint256 registeredCount;
        for (uint256 i = 0; i < _ownerOfRegisteredIds.length; ) {
            registeredCount += _registeredNengajoes[_ownerOfRegisteredIds[i]].maxSupply;
            unchecked {
                ++i;
            }
        }

        uint256 amount = 1;
        if (registeredCount > 5) {
            amount = _maxSupply * 10;
        } else if (registeredCount + _maxSupply > 5) {
            amount = (registeredCount + _maxSupply - 5) * 10;
        }

        uint256 tokenId = _tokenIds.current();
        ownerOfRegisteredIds[msg.sender].push(tokenId);
        registeredNengajoes.push(NengajoInfo(tokenId, _metaDataURL, msg.sender, _maxSupply));
        _tokenIds.increment();

        transferHenkakuV2(amount);

        // @dev Emit registeredNengajo
        // @param address, tokenId, URL of meta data, max supply
        emit RegisterNengajo(msg.sender, tokenId, _metaDataURL, _maxSupply);
    }

    // @return all registered NengajoInfo
    function retrieveAllNengajoes() external view returns (NengajoInfo[] memory) {
        return registeredNengajoes;
    }

    // @return registered NengajoInfo by tokenId
    function retrieveRegisteredNengajo(uint256 _tokenId) public view returns (NengajoInfo memory) {
        NengajoInfo[] memory _registeredNengajoes = registeredNengajoes;
        require(_registeredNengajoes.length > _tokenId, "Nengajo: not available");
        return _registeredNengajoes[_tokenId];
    }

    // @return registered NengajoInfo by address
    function retrieveRegisteredNengajoes(address _address) public view returns (NengajoInfo[] memory) {
        NengajoInfo[] memory _registeredNengajoes = registeredNengajoes;
        uint256[] memory _ownerOfRegisteredIds = ownerOfRegisteredIds[_address];
        NengajoInfo[] memory _ownerOfRegisteredNengajoes = new NengajoInfo[](_ownerOfRegisteredIds.length);

        for (uint256 i = 0; i < _ownerOfRegisteredIds.length; ) {
            NengajoInfo memory _registeredNengajo = _registeredNengajoes[_ownerOfRegisteredIds[i]];
            if (_registeredNengajo.creator == _address) {
                _ownerOfRegisteredNengajoes[i] = _registeredNengajo;
            }
            unchecked {
                ++i;
            }
        }
        return _ownerOfRegisteredNengajoes;
    }

    function checkNengajoAmount(uint256 _tokenId) private view {
        require(balanceOf(msg.sender, _tokenId) == 0, "Nengajo: You already have this nengajo");
        require(retrieveRegisteredNengajo(_tokenId).maxSupply > totalSupply(_tokenId), "Nengajo: Mint limit reached");
    }

    // @dev mint function
    function mint(uint256 _tokenId) public whenMintable {
        checkNengajoAmount(_tokenId);
        _mint(msg.sender, _tokenId, 1, "");
        ownerOfMintedIds[msg.sender].push(_tokenId);

        // @dev Emit mint event
        // @param address, tokenId
        emit Mint(msg.sender, _tokenId);
    }

    // @dev mint batch function
    function mintBatch(uint256[] memory _tokenIdsList) public whenMintable {
        uint256 tokenIdsLength = _tokenIdsList.length;
        uint256[] memory amountList = new uint256[](tokenIdsLength);

        for (uint256 i = 0; i < tokenIdsLength; ) {
            checkNengajoAmount(_tokenIdsList[i]);
            amountList[i] = 1;
            ownerOfMintedIds[msg.sender].push(_tokenIdsList[i]);
            unchecked {
                ++i;
            }
        }

        _mintBatch(msg.sender, _tokenIdsList, amountList, "");

        // @dev Emit mint batch event
        // @param address,tokenId list
        emit MintBatch(msg.sender, _tokenIdsList);
    }

    // @return holding tokenIds with address
    function retrieveMintedNengajoes() public view returns (NengajoInfo[] memory) {
        NengajoInfo[] memory _registeredNengajoes = registeredNengajoes;
        uint256[] memory _ownerOfMintedIds = ownerOfMintedIds[msg.sender];
        NengajoInfo[] memory _ownerOfMintedNengajoes = new NengajoInfo[](_ownerOfMintedIds.length);

        for (uint256 i = 0; i < _ownerOfMintedIds.length; ) {
            _ownerOfMintedNengajoes[i] = _registeredNengajoes[_ownerOfMintedIds[i]];
            unchecked {
                ++i;
            }
        }

        return _ownerOfMintedNengajoes;
    }

    // @return token metadata uri
    function uri(uint256 _tokenId) public view override(ERC1155) returns (string memory) {
        return retrieveRegisteredNengajo(_tokenId).uri;
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
