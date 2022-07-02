pragma solidity ^0.8.0;

contract MultiSig {

    constructor(address[] memory owners, uint threshold) {
        require(owners.length > 0, "no owners given");
    }

}
