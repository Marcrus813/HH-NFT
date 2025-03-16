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
const { constructorParams } = require("../../configs/contract/basicNftParams");
const { basicNftResource } = require("../../configs/contract/resource-config");
const basicNftModule = require("../../ignition/modules/basicNft");

let currentNetwork = process.env.NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

if (!localFlag) {
    describe.skip;
} else {
    describe("Basic NFT", () => {
        let tokenName;
        let tokenSymbol;
        let basicNftContract;
        let basicNftAddress;
        let deployer, player0;

        async function deployFixture() {
            const { basicNft } = await ignition.deploy(basicNftModule);
            basicNftAddress = await basicNft.getAddress();
            return { basicNft };
        }

        beforeEach(async () => {
            [deployer, player0] = await ethers.getSigners();
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
                expect(actualName).to.be.equals(constructorParams.name);
                expect(actualSymbol).to.be.equals(constructorParams.symbol);
            });

            it("Should initialize token counter to 0", async () => {
                const tokenCounter = await basicNftContract.getTokenCounter();
                expect(tokenCounter).to.be.equals(0);
            });

            it("Should have the correct token uri", async () => {
                const tokenUri = await basicNftContract.tokenURI(0n);
                expect(tokenUri).to.be.equals(basicNftResource.ipfs.uri);
            });
        });

        describe("Minting", () => {
            let initialTokenCounter;
            let initialPlayer0Balance;
            beforeEach(async () => {
                initialTokenCounter = await basicNftContract.getTokenCounter();
                initialPlayer0Balance = await basicNftContract.balanceOf(
                    player0.address,
                );
                const mintTxn = await basicNftContract
                    .connect(player0)
                    .mintNft();
                await mintTxn.wait(1);
            });

            it("Should mint a new token", async () => {
                const latestTokenCounter =
                    await basicNftContract.getTokenCounter();
                expect(latestTokenCounter).to.be.not.equals(
                    initialTokenCounter,
                );
            });

            it("Should increment token counter", async () => {
                const currentTokenCount =
                    await basicNftContract.getTokenCounter();
                expect(currentTokenCount).to.be.equals(
                    initialTokenCounter + 1n,
                );
            });

            it("Should increase the owner's token count", async () => {
                const player0Balance = await basicNftContract.balanceOf(
                    player0.address,
                );
                expect(player0Balance).to.be.equals(initialPlayer0Balance + 1n);
            });

            it("Should record the token's owner", async () => {
                const currentTokenCount =
                    await basicNftContract.getTokenCounter();
                const validTokenIds = [];
                for (let index = 0; index < currentTokenCount; index++) {
                    try {
                        const owner = await basicNftContract.ownerOf(index);
                        if (owner != ethers.ZeroAddress) {
                            validTokenIds.push(index);
                        }
                    } catch (e) {
                        continue;
                    }
                }
                const latestTokenId = validTokenIds[validTokenIds.length - 1];
                const tokenOwner =
                    await basicNftContract.ownerOf(latestTokenId);
                expect(tokenOwner).to.be.equals(player0.address);
            });

            it("Should emit a `Transfer` event", async () => {
                // Chai approach, just check the event is emitted
                const mintTxn = await basicNftContract
                    .connect(player0)
                    .mintNft();
                const currentTokenCount =
                    await basicNftContract.getTokenCounter();
                await expect(mintTxn)
                    .to.emit(basicNftContract, "Transfer")
                    .withArgs(
                        ethers.ZeroAddress,
                        player0.address,
                        currentTokenCount - 1n,
                    );
                // ***
                // Ethers approach, also check the params
                /* const mintTransferEventFilter =
                    basicNftContract.filters.Transfer();
                const mintTransferEvents = await basicNftContract.queryFilter(
                    mintTransferEventFilter,
                );
                const latestTransferEvent =
                    mintTransferEvents[mintTransferEvents.length - 1];
                expect(latestTransferEvent.args[0]).to.be.equals(
                    ethers.ZeroAddress,
                );
                expect(latestTransferEvent.args[1]).to.be.equals(
                    player0.address,
                );
                expect(latestTransferEvent.args[2]).to.be.equals(
                    currentTokenCount - 1n,
                ); */
            });

            // Don't think this is necessary, cuz in my own contract there's no way to call `_mint` directly with a modified tokenId
            /* it("Should revert if token already exists", async () => {

            }); */
        });
    });
}
