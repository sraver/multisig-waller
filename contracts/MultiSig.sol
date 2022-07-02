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
    uint256 private approvalsThreshold;
    Transaction[] private transactions;
    mapping(uint256 => mapping(address => bool)) private approvals;

    /**
     * Verifies the caller is one of the owners
     */
    modifier onlyOwner() {
        require(isOwner[msg.sender], "address not allowed");
        _;
    }

    /**
     * Verifies the transaction exists
     */
    modifier existsTx(uint256 _txId) {
        require(_txId < transactions.length, "invalid tx ID");
        _;
    }

    /**
     * Verifies a transactions has enough approvals
     */
    modifier enoughApprovals(uint256 _txId) {
        uint256 totalApprovals;
        for (uint256 index; index < owners.length; index++) {
            if (approvals[_txId][owners[index]]) {
                totalApprovals++;
            }
        }
        require(totalApprovals >= approvalsThreshold, "not enough approvals");
        _;
    }

    /**
     * Verifies a transaction is not yet executed
     */
    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "already executed");
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

        approvalsThreshold = _threshold;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * Submits a new transaction to the contract so it can be voted by the owners
     * @param _to The address which the transaction will call
     * @param _value The amount of native coins that will be sent on the tx
     * @param _data The encoded data that will be used to execute the tx
     */
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

    /**
     * Approves a specific transaction in name of tha caller
     * @param _txId The ID of the transaction
     * @notice Requires the transaction to exists and not be executed
     */
    function approve(uint256 _txId) external onlyOwner existsTx(_txId) notExecuted(_txId) {
        approvals[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    /**
     * Revokes a specific transaction
     * @param _txId The ID of the transaction
     * @notice Requires the transaction to exists and not be executed
     */
    function revoke(uint256 _txId) external onlyOwner existsTx(_txId) notExecuted(_txId) {
        approvals[_txId][msg.sender] = false;
        emit Revoke(msg.sender, _txId);
    }

    /**
     * Executes a specific transaction
     * @param _txId The ID of the transaction
     * @notice Requires the transaction to exists, not be executed and have enough approvals
     */
    function execute(uint256 _txId) external onlyOwner existsTx(_txId) notExecuted(_txId) enoughApprovals(_txId) {
        Transaction storage transaction = transactions[_txId];

        transaction.executed = true;

        (bool success,) = transaction.to.call{value : transaction.value}(transaction.data);

        require(success, "tx failed");

        emit Execute(_txId);
    }

    /** Accessors **/

    /**
     * @return List of current owners
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @return Minimum amount of required approvals
     */
    function getThreshold() public view returns (uint256) {
        return approvalsThreshold;
    }
}
