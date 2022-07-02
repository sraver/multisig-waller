describe("Multi-sig wallet", function () {

  describe("Initialize", function () {
    it("Should construct and have the correct owners and required arguments", async function () {
      // pass
    });

    it("Should fail to construct if no owners are given", async function () {
      // pass
    });

    it("Should fail to construct if some owner has zero address", async function () {
      // pass
    });

    it("Should fail to construct if the threshold is higher than the given owners", async function () {
      // pass
    });
  });

  describe("Management", function () {
    describe("Deposit", function () {
      it("Should allow anyone to deposit ether and emit an event", async function () {
        // pass
      });
    });

    describe("Submit", function () {
      it("Should allow an owner to submit a new transaction", async function () {
        // pass
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
