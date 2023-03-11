// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Administration.sol";
import "./MintManager.sol";

contract PublicTicket is ERC1155, ERC1155Supply, ERC2771Context, Administration, MintManager {
    //@dev count up tokenId from 0
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public name;
    string public symbol;

    mapping(address => uint256[]) private ownerOfRegisteredIds;
    mapping(address => uint256[]) private ownerOfMintedIds;

    //@dev Declare Event to emit
    event RegisterTicket(address indexed creator, uint256 tokenId, string metaDataURL, uint256 maxSupply);
    event Mint(address indexed minter, uint256 indexed tokenId);
    event MintBatch(address indexed minter, uint256[] tokenIds);

    /**
     * @param uri: metadata uri
     * @param creator: creator's wallet address
     * @param maxSupply: max supply number of token
     */
    struct TicketInfo {
        uint256 id;
        string uri;
        address creator;
        uint256 maxSupply;
    }

    TicketInfo[] private registeredTickets;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _open_blockTimestamp,
        uint256 _close_blockTimestamp,
        address _trustedForwarder
    )
        ERC1155("")
        ERC2771Context(_trustedForwarder)
        MintManager(_open_blockTimestamp, _close_blockTimestamp)
    {
        name = _name;
        symbol = _symbol;

        registeredTickets.push(TicketInfo(0, "", address(0), 0));
        _tokenIds.increment();
    }

    modifier whenMintable() {
        require(
            (block.timestamp > open_blockTimestamp && close_blockTimestamp > block.timestamp) || mintable,
            "Ticket: Not mintable"
        );
        _;
    }

    function registerTicket(uint256 _maxSupply, string memory _metaDataURL) public onlyAdmins {
        require(_maxSupply != 0 || keccak256(bytes(_metaDataURL)) != keccak256(bytes("")), "Ticket: invalid params");

        uint256 tokenId = _tokenIds.current();
        ownerOfRegisteredIds[_msgSender()].push(tokenId);
        registeredTickets.push(TicketInfo(tokenId, _metaDataURL, _msgSender(), _maxSupply));
        _tokenIds.increment();

        // @dev Emit registeredTicket
        // @param address, tokenId, URL of meta data, max supply
        emit RegisterTicket(_msgSender(), tokenId, _metaDataURL, _maxSupply);
    }

    // @return all registered TicketInfo
    function retrieveAllTickets() external view returns (TicketInfo[] memory) {
        return registeredTickets;
    }

    // @return registered TicketInfo by tokenId
    function retrieveRegisteredTicket(uint256 _tokenId) public view returns (TicketInfo memory) {
        TicketInfo[] memory _registeredTickets = registeredTickets;
        require(_registeredTickets.length > _tokenId, "Ticket: not available");
        return _registeredTickets[_tokenId];
    }

    // @return registered TicketInfo by address
    function retrieveRegisteredTickets(address _address) public view returns (TicketInfo[] memory) {
        TicketInfo[] memory _registeredTickets = registeredTickets;
        uint256[] memory _ownerOfRegisteredIds = ownerOfRegisteredIds[_address];
        TicketInfo[] memory _ownerOfRegisteredTickets = new TicketInfo[](_ownerOfRegisteredIds.length);

        for (uint256 i = 0; i < _ownerOfRegisteredIds.length; ) {
            TicketInfo memory _registeredTicket = _registeredTickets[_ownerOfRegisteredIds[i]];
            if (_registeredTicket.creator == _address) {
                _ownerOfRegisteredTickets[i] = _registeredTicket;
            }
            unchecked {
                ++i;
            }
        }
        return _ownerOfRegisteredTickets;
    }

    function checkTicketAmount(uint256 _tokenId) private view {
        require(balanceOf(_msgSender(), _tokenId) == 0, "Ticket: You already have this Ticket");
        require(retrieveRegisteredTicket(_tokenId).maxSupply > totalSupply(_tokenId), "Ticket: Mint limit reached");
    }

    // @dev mint function
    function mint(uint256 _tokenId) public whenMintable {
        checkTicketAmount(_tokenId);
        _mint(_msgSender(), _tokenId, 1, "");
        ownerOfMintedIds[_msgSender()].push(_tokenId);

        // @dev Emit mint event
        // @param address, tokenId
        emit Mint(_msgSender(), _tokenId);
    }

    // @dev mint batch function
    function mintBatch(uint256[] memory _tokenIdsList) public whenMintable {
        uint256 tokenIdsLength = _tokenIdsList.length;
        uint256[] memory amountList = new uint256[](tokenIdsLength);

        for (uint256 i = 0; i < tokenIdsLength; ) {
            checkTicketAmount(_tokenIdsList[i]);
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
    function retrieveMintedTickets(address _address) public view returns (TicketInfo[] memory) {
        TicketInfo[] memory _registeredTickets = registeredTickets;
        uint256[] memory _ownerOfMintedIds = ownerOfMintedIds[_address];
        TicketInfo[] memory _ownerOfMintedTickets = new TicketInfo[](_ownerOfMintedIds.length);

        for (uint256 i = 0; i < _ownerOfMintedIds.length; ) {
            _ownerOfMintedTickets[i] = _registeredTickets[_ownerOfMintedIds[i]];
            unchecked {
                ++i;
            }
        }

        return _ownerOfMintedTickets;
    }

    // @return token metadata uri
    function uri(uint256 _tokenId) public view override(ERC1155) returns (string memory) {
        return retrieveRegisteredTicket(_tokenId).uri;
    }

    // @return token metadata uri
    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        return retrieveRegisteredTicket(_tokenId).uri;
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
