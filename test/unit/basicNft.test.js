const { expect } = require("chai");
const { ethers, ignition } = require("hardhat");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {
    chainIds,
    networkConfig,
    devChains,
} = require("../../configs/network/network-config");
const { constructorParams } = require("../../configs/resource/basicNftParams");
const basicNftModule = require("../../ignition/modules/basicNft");

const currentNetwork = process.env.NETWORK || "hardhat";
const localFlag = devChains.includes(currentNetwork);

if (!localFlag) {
    describe.skip;
} else {
    describe("Basic NFT", () => {
        let tokenName;
        let tokenSymbol;
        let basicNftContract;
        let basicNftAddress;
        let deployer;

        async function deployFixture() {
            const { basicNft } = await ignition.deploy(basicNftModule);
            basicNftAddress = await basicNft.getAddress();
            return { basicNft };
        }

        beforeEach(async () => {
            [deployer] = await ethers.getSigners();
            const deployment = await loadFixture(deployFixture);
            basicNftContract = deployment.basicNft;
            tokenName = await basicNftContract.name();
            tokenSymbol = await basicNftContract.symbol();
        });

        describe("Deployment", () => {
            it("Should successfully deploy the contract", async () => {
                expect(basicNftAddress).to.be.properAddress;
            });

            it("Should have correct token name and symbol", async () => {
                const actualName = await basicNftContract.name();
                const actualSymbol = await basicNftContract.symbol();
                expect(actualName).to.be.equals(tokenName);
                expect(actualSymbol).to.be.equals(tokenSymbol);
            });

            it("Should initialize token counter to 0", async () => {
                const tokenCounter = await basicNftContract.getTokenCounter();
                expect(tokenCounter).to.be.equals(0);
            });
        });
    });
}
