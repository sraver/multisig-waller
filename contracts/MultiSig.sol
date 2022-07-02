//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSig {

    event Deposit(address sender, uint256 amount);
    event Submit(uint256 txId);
    event Approve(address owner, uint256 txId);
    event Revoke(address owner, uint256 txId);
    event Execute(uint256 txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    address[] private owners;
    mapping(address => bool) private isOwner;
    uint256 private threshold;
    Transaction[] private transactions;
    mapping(uint256 => mapping(address => bool)) private approvals;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "address not allowed");
        _;
    }

    modifier existsTx(uint256 _txId) {
        require(_txId < transactions.length, "invalid tx ID");
        _;
    }

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "no owners given");
        require(_threshold <= _owners.length, "threshold bigger than total owners");

        for (uint index; index < _owners.length; index++) {
            require(_owners[index] != address(0), "owner address not valid");

            owners.push(_owners[index]);
            isOwner[_owners[index]] = true;
        }

        threshold = _threshold;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address _to, uint256 _value, bytes calldata _data) external onlyOwner {
        require(_to != address(0), "destination address not allowed");
        require(_value > 0 || _data.length > 0, "should have value or data");

        transactions.push(Transaction({
            to : _to,
            value : _value,
            data : _data,
            executed : false
        }));
        emit Submit(transactions.length - 1);
    }

    function approve(uint256 _txId) external onlyOwner existsTx(_txId) {
        approvals[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    function revoke(uint256 _txId) external onlyOwner existsTx(_txId) {
        approvals[_txId][msg.sender] = false;
        emit Revoke(msg.sender, _txId);
    }

    function execute(uint256 _txId) external onlyOwner {
        Transaction storage transaction = transactions[_txId];

        (bool success,) = transaction.to.call{value : transaction.value}(transaction.data);

        require(success, "tx failed");

        emit Execute(_txId);
    }

    /** Accessors **/

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getThreshold() public view returns (uint256) {
        return threshold;
    }
}
