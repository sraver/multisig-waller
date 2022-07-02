//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSig {

    address[] private owners;
    uint private threshold;

    constructor(address[] memory _owners, uint _threshold) {
        require(_owners.length > 0, "no owners given");
        require(_threshold <= _owners.length, "threshold bigger than total owners");

        for (uint index; index < _owners.length; index++) {
            require(_owners[index] != address(0), "owner address not valid");

            owners.push(_owners[index]);
        }

        threshold = _threshold;
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getThreshold() public view returns (uint) {
        return threshold;
    }
}
