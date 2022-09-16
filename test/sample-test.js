const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { ensure0xPrefix } = require("typechain");

describe("Despliegue de contactos", function() {
    let deployer, user, attacker;

    beforeEach(async function() {
        [deployer, user, attacker] = await ethers.getSigners();
        const BankFactory = await ethers.getContractFactory("Bank", deployer);
        this.bankContract = await BankFactory.deploy();

        await this.bankContract.deposit({ value: ethers.utils.parseEther("100") });
        await this.bankContract.connect(user).deposit({ value: ethers.utils.parseEther("50") });

        const AttackerFactory = await ethers.getContractFactory("Attacker", attacker);
        this.attackerContract = await AttackerFactory.deploy(this.bankContract.address);
    });

    describe("Test depositar y sacar dinero del banco", function() {
        it("El banco acepta la realizacion de depositos.", async function () {
            const deployerBalance = await this.bankContract.balanceOf(deployer.address);
            expect(deployerBalance).to.eq(ethers.utils.parseEther("100"));
            
            const userBalance = await this.bankContract.balanceOf(user.address);
            expect(userBalance).to.eq(ethers.utils.parseEther("50"));
        });

        it ("El banco acepta la realizacion de prestamos.", async function () {
            await this.bankContract.withdraw();
            const deployerBalance = await this.bankContract.balanceOf(deployer.address);
            expect(deployerBalance).to.eq(0);

            const userBalance = await this.bankContract.balanceOf(user.address);
            expect(userBalance).to.eq(ethers.utils.parseEther("50"));
        });

        it ("Realizar ataque", async function () {
            console.log("");
            console.log("*** Antes ***");
            console.log(`Saldo del banco: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.bankContract.address)).toString()}`);
            console.log(`Saldo del atacante: ${ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)).toString()}`);
            console.log("");

            await this.attackerContract.attack({value: ethers.utils.parseEther("10") });
            console.log("");
            console.log("*** Despues ***");
            console.log(`Saldo del banco: ${ethers.utils.formatEther(await ethers.provider.getBalance(this.bankContract.address)).toString()}`);
            console.log(`Saldo del atacante: ${ethers.utils.formatEther(await ethers.provider.getBalance(attacker.address)).toString()}`);
            console.log("");
            expect(await ethers.provider.getBalance(this.bankContract.address)).to.eq(0);
        });
    });
});