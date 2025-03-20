const { expect } = require("chai");
const { ethers, ignition } = require("hardhat");

const svgNftModule = require("../../ignition/modules/svgNft");
const { svgNftParams } = require("../../configs/contract/svgNftParams");

const { devChains } = require("../../configs/network/network-config");
let currentNetwork = process.env.NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

if (localFlag) {
    describe.skip;
} else {
    describe("SVG NFT Staging", () => {
        let svgNft;
        let svgNftAddress;

        beforeEach(async () => {
            const deployments = await ignition.deploy(svgNftModule);
            svgNft = deployments.svgNft;
            svgNftAddress = await svgNft.getAddress();
        });

        describe("Price feed", () => {
            it("Should be able to get price", async () => {
                const ethUsdPrice = await svgNft.getTokenStockPrice();
                expect(ethUsdPrice).to.be.a("BigInt");
            });
        });
    });
}
