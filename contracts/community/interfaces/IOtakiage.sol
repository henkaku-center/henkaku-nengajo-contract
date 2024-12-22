// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IOtakiage is IERC721 {

  struct TokenURIParams {
    string name;
    string description;
    string image;
  }

  event Mint(address indexed to, uint256 indexed tokenId);
  event SendAllOmamori(address indexed from, uint256[] ids, uint256[] values);
  event OtakiageEvent(address[] users);

  function getOtakiageUsersArr() external view returns (address[] memory);

  function getOtakiageUserCount() external view returns (uint256);

  function getOtakiageUserOmamoriIds(address user) external view returns (uint256[] memory);

  function getOtakiageUserOmamoriIdsCount(address user) external view returns (uint256);

  function setOmamoriAddress(address _omamoriAddress) external;

  function setOmamoriTypeCount(uint256 _omamoriTypeCount) external;

  function setOmamoriTokenIdOffset(uint256 _omamoriTokenIdOffset) external;

  function setCID(string calldata _cid) external;

  function setImageExtension(string calldata _imageExtension) external;

  function mintOtakiage(address to) external;

  function batchMintOtakiage(address[] memory tos) external;

  function fetchHoldingOmamoriBalance() external view returns (uint256[] memory, uint256[] memory);

  function recordOtakiageUser(address user, uint256[] memory omamoriIds) external;

  function recordOtakiageUsers(address[] memory users, uint256[] memory omamoriIds) external;
  
  function sendAllOmamori() external;

  function otakiage() external;

  function tokenURI(
    uint256 tokenId
  ) external view returns (string memory);

  function getImage(uint256 tokenId) external view returns (string memory);

  function getCID() external view returns (string memory);
}
