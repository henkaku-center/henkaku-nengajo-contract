// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./Administration.sol";

contract Forwarder is EIP712, Administration {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    bytes32 private constant _TYPEHASH =
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");
    mapping(address => bool) public targetContracts;
    mapping(address => mapping(bytes4 => bool)) public targetMethods;
    mapping(address => uint256) private _nonces;

    constructor() EIP712("Forwarder", "0.0.1") {}

    function whitelistTarget(address target, bool isAllowed) public onlyAdmins {
        targetContracts[target] = isAllowed;
    }

    function whitelistMethod(address target, bytes4 method, bool isAllowed) public onlyAdmins {
        targetMethods[target][method] = isAllowed;
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function readBytes4(
        bytes memory b,
        uint256 index
    )
        internal
        pure
        returns (bytes4 result)
    {
        require(b.length >= index + 4, "Forwarder: data too short");

        assembly {
            result := mload(add(b, add(index,32)))
            result := and(result, 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000)
        }
        return result;
    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(abi.encode(_TYPEHASH, req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)))
        ).recover(signature);
        address target = req.to;
        bytes4 method = readBytes4(req.data, 0);
        return _nonces[req.from] == req.nonce && signer == req.from && targetContracts[target] && targetMethods[target][method];
    }

    function execute(ForwardRequest calldata req, bytes calldata signature)
        public
        payable
        returns (bool, bytes memory)
    {
        require(verify(req, signature), "Forwarder: signature does not match request");
        _nonces[req.from] = req.nonce + 1;

        (bool success, bytes memory returndata) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        if (gasleft() <= req.gas / 63) {
            assembly {
                invalid()
            }
        }

        return (success, returndata);
    }
}