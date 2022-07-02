import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("Multi-Sig wallet", function () {
  let MultiSigFactory = ethers.getContractFactory("MultiSig");

  describe("Initialize", function () {
    it("Should construct and have the correct owners and required arguments", async function () {
      // Arrange
      const [deployer, owner1, owner2] = await ethers.getSigners();

      // Act
      const contract = await (await MultiSigFactory).deploy([
        owner1.address,
        owner2.address,
      ], 2);

      await contract.deployed();

      const owners = await contract.getOwners();
      const threshold = await contract.getThreshold();

      // Assert
      expect(owners).to.deep.equal([
        owner1.address,
        owner2.address,
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
      const [deployer, owner1] = await ethers.getSigners();

      // Act
      const deployTx = (await MultiSigFactory).deploy([
        owner1.address,
        ethers.constants.AddressZero
      ], 0);

      // Assert
      await expect(deployTx).to.revertedWith("owner address not valid");
    });

    it("Should fail to construct if the threshold is higher than the given owners", async function () {
      // Arrange
      const [deployer, owner1, owner2] = await ethers.getSigners();

      // Act
      const deployTx = (await MultiSigFactory).deploy([
        owner1.address,
        owner2.address,
      ], 3);

      // Assert
      await expect(deployTx).to.revertedWith("threshold bigger than total owners");
    });
  });

  describe("Management", function () {
    let contract: Contract;

    beforeEach(async () => {
      const [deployer, owner1, owner2, owner3] = await ethers.getSigners();
      contract = await (await MultiSigFactory).deploy([
        owner1.address,
        owner2.address,
        owner3.address,
      ], 2);
      await contract.deployed();
    });

    describe("Deposit", function () {
      it("Should allow anyone to deposit ether", async function () {
        // Arrange
        const [deployer] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");

        // Act
        const tx = deployer.sendTransaction({
          to: contract.address,
          value: amount,
        });

        // Assert
        await expect(tx)
          .to.emit(contract, "Deposit")
          .withArgs(deployer.address, amount);
      });
    });

    describe("Submit", function () {
      it("Should allow an owner to submit a new transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(owner1).submit(deployer.address, 1, '0x');

        // Assert
        await expect(tx)
          .to.emit(contract, "Submit")
          .withArgs(0);
      });

      it("Should fail to submit a transaction if destination address is zero", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(owner1).submit(ethers.constants.AddressZero, 1, '0x');

        // Assert
        await expect(tx).to.revertedWith("destination address not allowed")
      });

      it("Should fail to submit a transaction without value or data", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(owner1).submit(deployer.address, 0, '0x');

        // Assert
        await expect(tx).to.revertedWith("should have value or data")
      });

      it("Should fail if anyone else submits a new transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(deployer).submit(owner1.address, 1, '0x');

        // Assert
        await expect(tx).to.revertedWith("address not allowed");
      });
    });

    describe("Approve", function () {
      it("Should allow an owner to approve an existing transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();
        await contract.connect(owner1).submit(deployer.address, 1, '0x');

        // Act
        const tx = contract.connect(owner1).approve(0)

        // Assert
        await expect(tx)
          .to.emit(contract, "Approve")
          .withArgs(owner1.address, 0);
      });

      it("Should fail if an owner tries to approve an executed transaction", async function () {
        // Arrange
        const [deployer, owner1, owner2, owner3] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");
        await deployer.sendTransaction({
          to: contract.address,
          value: amount,
        });
        await contract.connect(owner1).submit(deployer.address, amount, '0x');
        await contract.connect(owner1).approve(0);
        await contract.connect(owner2).approve(0);
        await contract.connect(owner2).execute(0);

        // Act
        const tx = contract.connect(owner3).approve(0)

        // Assert
        await expect(tx).to.revertedWith("already executed");
      });

      it("Should fail if an owner tries to approve a non-existing transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();
        await contract.connect(owner1).submit(deployer.address, 1, '0x');

        // Act
        const tx = contract.connect(owner1).approve(1)

        // Assert
        await expect(tx).to.revertedWith("invalid tx ID");
      });

      it("Should fail if anyone else tries to approve an existing transaction", async function () {
        // Arrange
        const [deployer] = await ethers.getSigners();

        // Act
        const tx = contract.connect(deployer).approve(0);

        // Assert
        await expect(tx).to.revertedWith("address not allowed");
      });
    });

    describe("Revoke", function () {
      it("Should allow an owner to revoke the an already approved transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();
        await contract.connect(owner1).submit(deployer.address, 1, '0x');
        await contract.connect(owner1).approve(0);

        // Act
        const tx = contract.connect(owner1).revoke(0)

        // Assert
        await expect(tx)
          .to.emit(contract, "Revoke")
          .withArgs(owner1.address, 0);
      });

      it("Should fail if an owner tries to revoke an executed transaction", async function () {
        // Arrange
        const [deployer, owner1, owner2] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");
        await deployer.sendTransaction({
          to: contract.address,
          value: amount,
        });
        await contract.connect(owner1).submit(deployer.address, amount, '0x');
        await contract.connect(owner1).approve(0);
        await contract.connect(owner2).approve(0);
        await contract.connect(owner2).execute(0);

        // Act
        const tx = contract.connect(owner1).revoke(0)

        // Assert
        await expect(tx).to.revertedWith("already executed");
      });

      it("Should fail if an owner tries to revoke a non-existing transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(owner1).revoke(0)

        // Assert
        await expect(tx).to.revertedWith("invalid tx ID");
      });

      it("Should fail if anyone else tries to revoke an already approved transaction", async function () {
        // Arrange
        const [deployer] = await ethers.getSigners();

        // Act
        const tx = contract.connect(deployer).revoke(0);

        // Assert
        await expect(tx).to.revertedWith("address not allowed");
      });
    });

    describe("Execute", function () {
      it("Should allow an owner to execute a transaction with enough approvals", async function () {
        // Arrange
        const [deployer, owner1, owner2] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");
        await deployer.sendTransaction({
          to: contract.address,
          value: amount,
        });
        await contract.connect(owner1).submit(deployer.address, amount, '0x');
        await contract.connect(owner1).approve(0);
        await contract.connect(owner2).approve(0);

        // Act
        const tx = contract.connect(owner1).execute(0)

        // Assert
        await expect(tx)
          .to.emit(contract, "Execute")
          .withArgs(0);
      });

      it("Should fail if an owner tries execute a transaction with not enough approvals", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");
        await deployer.sendTransaction({
          to: contract.address,
          value: amount,
        });
        await contract.connect(owner1).submit(deployer.address, amount, '0x');
        await contract.connect(owner1).approve(0);

        // Act
        const tx = contract.connect(owner1).execute(0)

        // Assert
        await expect(tx).to.revertedWith("not enough approvals")
      });

      it("Should fail if an owner tries execute a transaction already executed", async function () {
        // Arrange
        const [deployer, owner1, owner2] = await ethers.getSigners();
        const amount = ethers.utils.parseEther("1.0");
        await deployer.sendTransaction({
          to: contract.address,
          value: amount,
        });
        await contract.connect(owner1).submit(deployer.address, amount, '0x');
        await contract.connect(owner1).approve(0);
        await contract.connect(owner2).approve(0);
        await contract.connect(owner2).execute(0);

        // Act
        const tx = contract.connect(owner1).execute(0)

        // Assert
        await expect(tx).to.revertedWith("already executed");
      });

      it("Should fail if an owner tries execute a non-existing transaction", async function () {
        // Arrange
        const [deployer, owner1] = await ethers.getSigners();

        // Act
        const tx = contract.connect(owner1).execute(0)

        // Assert
        await expect(tx).to.revertedWith("invalid tx ID");
      });

      it("Should fail if anyone else tries to execute a transaction", async function () {
        // Arrange
        const [deployer] = await ethers.getSigners();

        // Act
        const tx = contract.connect(deployer).execute(0);

        // Assert
        await expect(tx).to.revertedWith("address not allowed");
      });
    });
  });

});
