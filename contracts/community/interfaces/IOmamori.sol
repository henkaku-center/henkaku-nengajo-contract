// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IHenkaku1155Mint.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IOmamori is IERC1155 {
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

    function registerNengajo(uint256 _maxSupply, string memory _metaDataURL) external;

    // @return all registered NengajoInfo
    function retrieveAllNengajoes() external view returns (NengajoInfo[] memory);

    // @return registered NengajoInfo by tokenId
    function retrieveRegisteredNengajo(uint256 _tokenId) external view returns (NengajoInfo memory);

    // @return registered NengajoInfo by address
    function retrieveRegisteredNengajoes(address _address) external view returns (NengajoInfo[] memory);

    // @dev mint function
    function mint(uint256 _tokenId) external;

    // @dev mint batch function
    function mintBatch(uint256[] memory _tokenIdsList) external;

    // @return holding tokenIds with address
    function retrieveMintedNengajoes(address _address) external view returns (NengajoInfo[] memory);

    function setNft(address _nft) external;

    function otakiage() external;

    // @return token metadata uri
    function uri(uint256 _tokenId) external view returns (string memory);

    // @return token metadata uri
    function tokenURI(uint256 _tokenId) external view returns (string memory);
}
