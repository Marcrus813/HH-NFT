const { expect } = require("chai");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers, ignition } = require("hardhat");

const fs = require("fs");
const path = require("path");

const svgNftModule = require("../../ignition/modules/svgNft");

const { svgNftParams } = require("../../configs/contract/svgNftParams");
const { mockParams } = require("../../configs/contract/aggregatorParams");

const { devChains } = require("../../configs/network/network-config");
let currentNetwork = process.env.NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

if (!localFlag) {
    describe.skip;
} else {
    describe("Dynamic SVG NFT", () => {
        let svgNft;
        let svgNftAddress;
        let aggregatorMock;
        let aggregatorMockAddress;

        let initialBalanceMap = new Map();
        let availableAccounts;
        let deployer;

        async function deployFixture() {
            const { svgNft, aggregatorV3Mock } =
                await ignition.deploy(svgNftModule);
            svgNftAddress = await svgNft.getAddress();
            aggregatorMockAddress = await aggregatorV3Mock.getAddress();

            availableAccounts = await ethers.getSigners();
            [deployer] = availableAccounts;
            for (let account of availableAccounts) {
                const accountBalance = await ethers.provider.getBalance(
                    account.address,
                );
                initialBalanceMap.set(account.address, accountBalance);
            }
            return { svgNft, aggregatorV3Mock };
        }

        beforeEach(async () => {
            const deployments = await loadFixture(deployFixture);
            svgNft = deployments.svgNft;
            aggregatorMock = deployments.aggregatorV3Mock;
        });

        describe("Deployment", () => {
            describe("Aggregator V3 Mock", () => {
                it("Should have a valid address", async () => {
                    expect(aggregatorMockAddress).to.be.properAddress;
                });
                it("Should have the correct decimals", async () => {
                    const decimals = await aggregatorMock.decimals();
                    expect(decimals).to.be.equals(mockParams.decimals);
                });
                it("Should have the correct answer", async () => {
                    const latestAnswer = await aggregatorMock.latestAnswer();
                    expect(latestAnswer).to.be.equals(mockParams.initialAnswer);
                });
                it("Should correctly return the answer", async () => {
                    const { answer } = await aggregatorMock.latestRoundData();
                    expect(answer).to.be.equals(mockParams.initialAnswer);
                });
            });
            describe("SVG NFT", () => {
                it("Should have a valid address", async () => {
                    expect(svgNftAddress).to.be.properAddress;
                });
                it("Should correctly set price feed address", async () => {
                    const priceFeedAddress = await svgNft.getPriceFeedAddress();
                    expect(priceFeedAddress).to.be.equals(
                        aggregatorMockAddress,
                    );
                });
            });
        });
        describe("Initial state", () => {
            it("Should have token count of 0", async () => {
                const tokenCount = await svgNft.getTokenCounter();
                expect(tokenCount).to.be.equals(0);
            });
            it("Should have correct mint fee", async () => {
                const mintFee = await svgNft.getMintFee();
                expect(mintFee).to.be.equals(svgNftParams.mintFee);
            });
            it("Should have correct SAKA token image URI", async () => {
                const sakaImageXml = fs.readFileSync(
                    path.join(
                        __dirname,
                        "../../resources/images/svgNft/SAKA.svg",
                    ),
                    "utf-8",
                );
                const sakaImageBase64 =
                    Buffer.from(sakaImageXml).toString("base64");

                const sakaImgURI = await svgNft.svgToImgURI(sakaImageXml);
                expect(sakaImgURI).to.be.equals(
                    `data:image/svg+xml;base64,${sakaImageBase64}`,
                );
            });
            it("Should have correct MLT token image URI", async () => {
                const mltImageXml = fs.readFileSync(
                    path.join(
                        __dirname,
                        "../../resources/images/svgNft/MLT.svg",
                    ),
                    "utf-8",
                );
                const mltImageBase64 =
                    Buffer.from(mltImageXml).toString("base64");
                const mltImgURI = await svgNft.svgToImgURI(mltImageXml);
                expect(mltImgURI).to.be.equals(
                    `data:image/svg+xml;base64,${mltImageBase64}`,
                );
            });
            it("Should have empty threshold map", async () => {
                const randomNum = Math.abs(Math.floor(Math.random() * 100));
                const threshold = await svgNft.getTokenThreshold(randomNum);
                expect(threshold).to.be.equals(0);
            });
        });
        describe("Tool functions", () => {
            it("Should provide correct price data", async () => {
                const price = await svgNft.getTokenStockPrice();
                expect(price).to.be.equals(mockParams.initialAnswer);
            });
            it("Should generate correct image URIs", async () => {
                const sakaImageXml = fs.readFileSync(
                    path.join(
                        __dirname,
                        "../../resources/images/svgNft/SAKA.svg",
                    ),
                    "utf-8",
                );
                const sakaImageBase64 =
                    Buffer.from(sakaImageXml).toString("base64");

                const sakaImgURI = await svgNft.svgToImgURI(sakaImageXml);
                expect(sakaImgURI).to.be.equals(
                    `data:image/svg+xml;base64,${sakaImageBase64}`,
                );

                const mltImageXml = fs.readFileSync(
                    path.join(
                        __dirname,
                        "../../resources/images/svgNft/MLT.svg",
                    ),
                    "utf-8",
                );
                const mltImageBase64 =
                    Buffer.from(mltImageXml).toString("base64");
                const mltImgURI = await svgNft.svgToImgURI(mltImageXml);
                expect(mltImgURI).to.be.equals(
                    `data:image/svg+xml;base64,${mltImageBase64}`,
                );
            });
            it("Should revert when requesting for non-existent token", async () => {
                const randomNum = Math.abs(Math.floor(Math.random() * 100));
                await expect(svgNft.tokenURI(randomNum))
                    .to.be.revertedWithCustomError(
                        svgNft,
                        "SvgNft__TokenNotFound",
                    )
                    .withArgs(randomNum);
            });
        });
        describe("Minting", () => {
            let minter0, minter1;
            const mintFee = svgNftParams.mintFee;
            const defaultThreshold = 200000000000 - 1;

            async function mintToken(minter, threshold) {
                const mintTxn = await svgNft
                    .connect(minter)
                    .mintNft(threshold, { value: mintFee });
                const mintTxnReceipt = await mintTxn.wait();
                const { blockNumber } = mintTxnReceipt;
                return blockNumber;
            }

            async function constructTokenURI(threshold) {
                const tokenName = svgNftParams.tokenName;

                const sakaImageXml = fs.readFileSync(
                    path.join(
                        __dirname,
                        "../../resources/images/svgNft/SAKA.svg",
                    ),
                    "utf-8",
                );
                const sakaImageBase64 =
                    Buffer.from(sakaImageXml).toString("base64");

                const sakaImgURI = `data:image/svg+xml;base64,${sakaImageBase64}`;

                const mltImageXml = fs.readFileSync(
                    path.join(
                        __dirname,
                        "../../resources/images/svgNft/MLT.svg",
                    ),
                    "utf-8",
                );
                const mltImageBase64 =
                    Buffer.from(mltImageXml).toString("base64");
                const mltImgURI = `data:image/svg+xml;base64,${mltImageBase64}`;

                const price = 200000000000;

                const selectedImgUri =
                    price > threshold ? sakaImgURI : mltImgURI;

                const metaData = {
                    name: tokenName,
                    description: "An SVG NFT based on chainlink price feeds",
                    image: selectedImgUri,
                    attributes: [{ trait_type: "stockPrice", value: price }],
                };

                const metaDataJson = JSON.stringify(metaData);
                const metaDataBase64 =
                    Buffer.from(metaDataJson).toString("base64");

                const constructedTokenURI = `data::application/json;base64,${metaDataBase64}`;
                return { constructedTokenURI, metaDataJson };
            }

            beforeEach(async () => {
                [, minter0, minter1] = availableAccounts;
                await mintToken(minter0, mintFee);
            });

            it("Should revert if not enough fee sent", async () => {
                const threshold = 100000000000;
                await expect(
                    svgNft
                        .connect(minter0)
                        .mintNft(threshold, { value: mintFee - 1n }),
                ).to.be.revertedWithCustomError(svgNft, "SvgNft__NotEnoughFee");
            });
            it("Should increment token count", async () => {
                const tokenCountBefore = await svgNft.getTokenCounter();
                await mintToken(minter1, defaultThreshold);
                const tokenCountAfter = await svgNft.getTokenCounter();
                expect(tokenCountAfter).to.be.equals(tokenCountBefore + 1n);
            });
            it("Should emit event: `NftMinted(tokenId, tokenOwner, threshold)`", async () => {
                const tokenCountBefore = await svgNft.getTokenCounter();
                await expect(
                    svgNft
                        .connect(minter1)
                        .mintNft(defaultThreshold, { value: mintFee }),
                )
                    .to.emit(svgNft, "NftMinted")
                    .withArgs(
                        tokenCountBefore + 1n,
                        minter1.address,
                        defaultThreshold,
                    );
            });
            it("Should record the minter's preferred threshold", async () => {
                const threshold = 150000000000;
                const mintBlockNum = await mintToken(minter1, threshold);
                const mintTokenEventFilter = svgNft.filters.NftMinted();
                const mintTokenEvents = await svgNft.queryFilter(
                    mintTokenEventFilter,
                    mintBlockNum,
                );
                const tokenId = mintTokenEvents[0].args.tokenId;
                const recordedThreshold =
                    await svgNft.getTokenThreshold(tokenId);
                expect(recordedThreshold).to.be.equals(threshold);
            });
            it("Should have generated correct token URI", async () => {
                const threshold = 100000000000;
                const mintBlockNum = await mintToken(minter1, threshold);
                const mintTokenEventFilter = svgNft.filters.NftMinted();
                const mintTokenEvents = await svgNft.queryFilter(
                    mintTokenEventFilter,
                    mintBlockNum,
                );
                const tokenId = mintTokenEvents[0].args.tokenId;
                const {constructedTokenURI, metaDataJson} = await constructTokenURI(threshold);
                const tokenURI = await svgNft.tokenURI(tokenId);
                expect(tokenURI).to.be.equals(constructedTokenURI);
            });
            it("Should have different token URI based on price and threshold", async () => {});
        });
    });
}
