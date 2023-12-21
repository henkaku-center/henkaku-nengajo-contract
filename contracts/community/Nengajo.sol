// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "../libs/Administration.sol";
import "../libs/MintManager.sol";
import "./InteractHenkakuToken.sol";

contract Nengajo is ERC1155, ERC1155Supply, Administration, MintManager, InteractHenakuToken, ERC2771Context {
    //@dev count up tokenId from 0
    uint256 private _tokenIds;

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
        address _henkakuPoolWallet,
        address _trustedForwarder
    )
        ERC1155("")
        ERC2771Context(_trustedForwarder)
        MintManager(_open_blockTimestamp, _close_blockTimestamp)
        InteractHenakuToken(_henkakuTokenV2, _henkakuPoolWallet)
    {
        name = _name;
        symbol = _symbol;

        registeredNengajoes.push(NengajoInfo(0, "", address(0), 0));
        ++_tokenIds;
    }

    modifier whenMintable() {
        require(
            (block.timestamp > open_blockTimestamp && close_blockTimestamp > block.timestamp) || mintable,
            "Nengajo: Not mintable"
        );
        _;
    }

    function registerNengajo(uint256 _maxSupply, string memory _metaDataURL) public {
        require(_maxSupply != 0 || keccak256(bytes(_metaDataURL)) != keccak256(bytes("")), "Nengajo: invalid params");
        uint256 amount = calcPrice(_maxSupply);

        uint256 tokenId = _tokenIds;
        ownerOfRegisteredIds[_msgSender()].push(tokenId);
        registeredNengajoes.push(NengajoInfo(tokenId, _metaDataURL, _msgSender(), _maxSupply));
        ++_tokenIds;

        transferHenkakuV2(amount);

        // @dev Emit registeredNengajo
        // @param address, tokenId, URL of meta data, max supply
        emit RegisterNengajo(_msgSender(), tokenId, _metaDataURL, _maxSupply);
    }

    function calcPrice(uint256 _maxSupply) public view returns (uint256) {
        uint256 registeredCount = retrieveRegisteredCount();
        uint256 amount = _calcPrice(_maxSupply + registeredCount) - _calcPrice(registeredCount);
        return amount;
    }

    function retrieveRegisteredCount() public view returns (uint256) {
        uint256[] memory _ownerOfRegisteredIds = ownerOfRegisteredIds[msg.sender];
        uint256 registeredCount;
        for (uint256 i = 0; i < _ownerOfRegisteredIds.length; ) {
            registeredCount += registeredNengajoes[_ownerOfRegisteredIds[i]].maxSupply;
            unchecked {
                ++i;
            }
        }
        return registeredCount;
    }

    function _calcPrice(uint256 maxSupply) private pure returns (uint256) {
        uint256 amount;
        if (maxSupply < 1) {
            amount = 0;
        } else if (1 <= maxSupply && maxSupply <= 10) {
            amount = 10 * 10 ** 18;
        } else if (10 < maxSupply && maxSupply < 101) {
            amount = (maxSupply * 5 - 40) * 10 ** 18;
        } else {
            amount = (maxSupply * 10 - 540) * 10 ** 18;
        }
        return amount;
    }

    // @return all registered NengajoInfo
    function retrieveAllNengajoes() external view returns (NengajoInfo[] memory) {
        return registeredNengajoes;
    }

    // @return registered NengajoInfo by tokenId
    function retrieveRegisteredNengajo(uint256 _tokenId) public view returns (NengajoInfo memory) {
        require(registeredNengajoes.length > _tokenId, "Nengajo: not available");
        return registeredNengajoes[_tokenId];
    }

    // @return registered NengajoInfo by address
    function retrieveRegisteredNengajoes(address _address) public view returns (NengajoInfo[] memory) {
                uint256[] memory _ownerOfRegisteredIds = ownerOfRegisteredIds[_address];
        NengajoInfo[] memory _ownerOfRegisteredNengajoes = new NengajoInfo[](_ownerOfRegisteredIds.length);

        for (uint256 i = 0; i < _ownerOfRegisteredIds.length; ) {
            NengajoInfo memory _registeredNengajo = registeredNengajoes[_ownerOfRegisteredIds[i]];
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
        require(balanceOf(_msgSender(), _tokenId) == 0, "Nengajo: You already have this nengajo");
        require(retrieveRegisteredNengajo(_tokenId).maxSupply > totalSupply(_tokenId), "Nengajo: Mint limit reached");
    }

    // @dev mint function
    function mint(uint256 _tokenId) public whenMintable {
        checkNengajoAmount(_tokenId);
        ownerOfMintedIds[_msgSender()].push(_tokenId);
        _mint(_msgSender(), _tokenId, 1, "");

        // @dev Emit mint event
        // @param address, tokenId
        emit Mint(_msgSender(), _tokenId);
    }

    // @dev mint batch function
    function mintBatch(uint256[] memory _tokenIdsList) public whenMintable {
        uint256 tokenIdsLength = _tokenIdsList.length;
        uint256[] memory amountList = new uint256[](tokenIdsLength);

        for (uint256 i = 0; i < tokenIdsLength; ) {
            checkNengajoAmount(_tokenIdsList[i]);
            amountList[i] = 1;
            ownerOfMintedIds[_msgSender()].push(_tokenIdsList[i]);
            unchecked {
                ++i;
            }
        }

        _mintBatch(_msgSender(), _tokenIdsList, amountList, "");

        // @dev Emit mint batch event
        // @param address,tokenId list
        emit MintBatch(_msgSender(), _tokenIdsList);
    }

    // @return holding tokenIds with address
    function retrieveMintedNengajoes(address _address) public view returns (NengajoInfo[] memory) {
                uint256[] memory _ownerOfMintedIds = ownerOfMintedIds[_address];
        NengajoInfo[] memory _ownerOfMintedNengajoes = new NengajoInfo[](_ownerOfMintedIds.length);

        for (uint256 i = 0; i < _ownerOfMintedIds.length; ) {
            _ownerOfMintedNengajoes[i] = registeredNengajoes[_ownerOfMintedIds[i]];
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

    // @return token metadata uri
    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        return retrieveRegisteredNengajo(_tokenId).uri;
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Supply) {
        ERC1155Supply._update(from, to, ids, values);
    }

    function _msgSender()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (address sender)
    {
        if (isTrustedForwarder(msg.sender)) {
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return super._msgSender();
        }
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (bytes calldata)
    {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return super._msgData();
        }
    }
}
