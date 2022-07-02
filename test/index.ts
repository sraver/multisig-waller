import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("Multi-Sig wallet", function () {
  let MultiSigFactory = ethers.getContractFactory("MultiSig");

  describe("Initialize", function () {
    it("Should construct and have the correct owners and required arguments", async function () {
      // Arrange
      const [owner, random1, random2] = await ethers.getSigners();

      // Act
      const contract = await (await MultiSigFactory).deploy([
        random1.address,
        random2.address,
      ], 2);

      await contract.deployed();

      const owners = await contract.getOwners();
      const threshold = await contract.getThreshold();

      // Assert
      expect(owners).to.deep.equal([
        random1.address,
        random2.address,
      ])
      expect(threshold).to.equal(2);
    });

    it("Should fail to construct if no owners are given", async function () {
      // Act
      const deployTx = (await MultiSigFactory).deploy([], 0);

      // Assert
      await expect(deployTx).to.revertedWith("no owners given");
    });

    it("Should fail to construct if some owner has zero address", async function () {
      // Arrange
      const [owner, random] = await ethers.getSigners();

      // Act
      const deployTx = (await MultiSigFactory).deploy([
        random.address,
        ethers.constants.AddressZero
      ], 0);

      // Assert
      await expect(deployTx).to.revertedWith("owner address not valid");
    });

    it("Should fail to construct if the threshold is higher than the given owners", async function () {
      // Arrange
      const [owner, random1, random2] = await ethers.getSigners();

      // Act
      const deployTx = (await MultiSigFactory).deploy([
        random1.address,
        random2.address,
      ], 3);

      // Assert
      await expect(deployTx).to.revertedWith("threshold bigger than total owners");
    });
  });

  describe("Management", function () {
    let contract: Contract;

    beforeEach(async () => {
      const [owner, random1, random2, random3] = await ethers.getSigners();
      contract = await (await MultiSigFactory).deploy([
        random1.address,
        random2.address,
        random3.address,
      ], 2);
      await contract.deployed();
    });

    describe("Deposit", function () {
      it("Should allow anyone to deposit ether", async function () {
        // Arrange
        const [owner] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");

        // Act
        const tx = owner.sendTransaction({
          to: contract.address,
          value: amount,
        });

        // Assert
        await expect(tx)
          .to.emit(contract, "Deposit")
          .withArgs(owner.address, amount);
      });
    });

    describe("Submit", function () {
      it("Should allow an owner to submit a new transaction", async function () {
        // Arrange
        const [owner, random1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(random1).submit(owner.address, 0, '0x');

        // Assert
        await expect(tx)
          .to.emit(contract, "Submit")
          .withArgs(0);
      });

      it("Should fail if anyone else submits a new transaction", async function () {
        // pass
      });
    });

    describe("Approve", function () {
      it("Should allow an owner to approve an existing transaction", async function () {
        // pass
      });

      it("Should fail if an owner tries to approve an executed transaction", async function () {
        // pass
      });

      it("Should fail if an owner tries to approve a non-existing transaction", async function () {
        // pass
      });

      it("Should fail if anyone else tries to approve an existing transaction", async function () {
        // pass
      });
    });

    describe("Revoke", function () {
      it("Should allow an owner to revoke the an already approved transaction", async function () {
        // pass
      });

      it("Should fail if an owner tries to revoke an executed transaction", async function () {
        // pass
      });

      it("Should fail if an owner tries to revoke a non-existing transaction", async function () {
        // pass
      });

      it("Should fail if anyone else tries to revoke an already approved transaction", async function () {
        // pass
      });
    });

    describe("Execute", function () {
      it("Should allow an owner to execute a transaction with enough approvals", async function () {
        // pass
      });

      it("Should fail if an owner tries execute a transaction with not enough approvals", async function () {
        // pass
      });

      it("Should fail if an owner tries execute a transaction already executed", async function () {
        // pass
      });

      it("Should fail if an owner tries execute a non-existing transaction", async function () {
        // pass
      });

      it("Should fail if anyone else tries to execute a transaction", async function () {
        // pass
      });
    });
  });

});
