//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSig {

    event Deposit(address sender, uint256 amount);
    event Submit(uint256 txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    address[] private owners;
    uint256 private threshold;
    Transaction[] private transactions;

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "no owners given");
        require(_threshold <= _owners.length, "threshold bigger than total owners");

        for (uint index; index < _owners.length; index++) {
            require(_owners[index] != address(0), "owner address not valid");

            owners.push(_owners[index]);
        }

        threshold = _threshold;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address _to, uint256 _value, bytes calldata _data) external {
        transactions.push(Transaction({
            to : _to,
            value : _value,
            data : _data,
            executed : false
        }));
        emit Submit(transactions.length - 1);
    }

    /** Accessors **/

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getThreshold() public view returns (uint256) {
        return threshold;
    }
}
