// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Administration.sol";
import "./InteractHenkakuToken.sol";
import "./MintManager.sol";

contract Ticket is ERC1155, ERC1155Supply, Administration, MintManager, InteractHenakuToken {
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
        address _henkakuTokenV2,
        address _henkakuPoolWallet
    ) ERC1155("") MintManager() InteractHenakuToken(_henkakuTokenV2, _henkakuPoolWallet) {
        name = _name;
        symbol = _symbol;

        registeredTickets.push(TicketInfo(0, "", address(0), 0));
        _tokenIds.increment();
    }

    modifier whenMintable() {
        require(mintable, "Ticket: Not mintable");
        require(checkHenkakuV2Balance(1), "Ticket: Insufficient Henkaku Token Balance");
        _;
    }

    function registerTicket(uint256 _maxSupply, string memory _metaDataURL) public {
        require(_maxSupply != 0 || keccak256(bytes(_metaDataURL)) != keccak256(bytes("")), "Ticket: invalid params");
        uint256 amount = calcPrice(_maxSupply);

        uint256 tokenId = _tokenIds.current();
        ownerOfRegisteredIds[msg.sender].push(tokenId);
        registeredTickets.push(TicketInfo(tokenId, _metaDataURL, msg.sender, _maxSupply));
        _tokenIds.increment();

        transferHenkakuV2(amount);

        // @dev Emit registeredTicket
        // @param address, tokenId, URL of meta data, max supply
        emit RegisterTicket(msg.sender, tokenId, _metaDataURL, _maxSupply);
    }

    function calcPrice(uint256 _maxSupply) public view returns (uint256) {
        TicketInfo[] memory _registeredTickets = registeredTickets;
        uint256[] memory _ownerOfRegisteredIds = ownerOfRegisteredIds[msg.sender];
        uint256 registeredCount;
        for (uint256 i = 0; i < _ownerOfRegisteredIds.length; ) {
            registeredCount += _registeredTickets[_ownerOfRegisteredIds[i]].maxSupply;
            unchecked {
                ++i;
            }
        }
        uint256 amount;
        uint256 totalMaxSupply = registeredCount + _maxSupply;
        if (totalMaxSupply <= 10) {
            amount = 10 * 10 ** 18;
        } else if (10 < totalMaxSupply || totalMaxSupply < 101) {
            amount = (totalMaxSupply * 5 - 40) * 10 ** 18;
        } else {
            amount = (totalMaxSupply * 10 - 540) * 10 ** 18;
        }
        return amount;
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
        require(balanceOf(msg.sender, _tokenId) == 0, "Ticket: You already have this ticket");
        require(retrieveRegisteredTicket(_tokenId).maxSupply > totalSupply(_tokenId), "Ticket: Mint limit reached");
    }

    // @dev mint function
    function mint(uint256 _tokenId) public whenMintable {
        checkTicketAmount(_tokenId);
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
            checkTicketAmount(_tokenIdsList[i]);
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
}
