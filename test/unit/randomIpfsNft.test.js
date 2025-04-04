const { ethers, ignition, network } = require("hardhat");
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const { PinataSDK } = require("pinata");

const randomIpfsNftModule = require("../../ignition/modules/randomIpfsNft");
const {
    randomIpfsNftParams,
    tokenTireMap,
} = require("../../configs/contract/randomIpfsNftParams");
const {
    vrfConsumerParams,
    vrfCoordinatorMockParams,
} = require("../../configs/contract/vrfParams");

const { devChains } = require("../../configs/network/network-config");

let currentNetwork = process.env.NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY_URL,
});

if (!localFlag) {
    describe.skip;
} else {
    // it("Should", async () => {});
    describe("Random IPFS NFT", () => {
        let randomIpfsNft;
        let randomIpfsNftAddress;
        let vrfCoordinatorMock;
        let vrfCoordinatorMockAddress;
        let initialBalanceMap = new Map();
        let availableAccounts;
        let deployer;

        async function deployFixture() {
            const { randomIpfsNft, vrfCoordinatorMock } =
                await ignition.deploy(randomIpfsNftModule);
            return { randomIpfsNft, vrfCoordinatorMock };
        }

        beforeEach(async () => {
            const deployments = await loadFixture(deployFixture);
            randomIpfsNft = deployments.randomIpfsNft;
            randomIpfsNftAddress = await randomIpfsNft.getAddress();
            vrfCoordinatorMock = deployments.vrfCoordinatorMock;
            vrfCoordinatorMockAddress = await vrfCoordinatorMock.getAddress();

            availableAccounts = await ethers.getSigners();
            for (let index = 0; index < availableAccounts.length; index++) {
                const account = availableAccounts[index];
                const accountBalance = await ethers.provider.getBalance(
                    account.address,
                );
                initialBalanceMap.set(account.address, accountBalance);
            }
            [deployer] = availableAccounts;
        });

        describe("Deployment", () => {
            describe("Deploy", () => {
                it("Should successfully deploy the mock contract(s)", async () => {
                    expect(vrfCoordinatorMockAddress).to.be.properAddress;
                });
                it("Should successfully deploy the contract(s)", async () => {
                    expect(randomIpfsNftAddress).to.be.properAddress;
                });
            });
            describe("Initialize", () => {
                describe("VRFCoordinator mock", () => {
                    it("Should have the correct base_fee", async () => {
                        const baseFee = await vrfCoordinatorMock.i_base_fee();
                        expect(baseFee).to.be.equals(
                            vrfCoordinatorMockParams.baseFee,
                        );
                    });
                    it("Should have the correct gas_price", async () => {
                        const gasPrice = await vrfCoordinatorMock.i_gas_price();
                        expect(gasPrice).to.be.equals(
                            vrfCoordinatorMockParams.gasPrice,
                        );
                    });
                    it("Should have the correct wei_per_unit_link", async () => {
                        const weiPerUnitLink =
                            await vrfCoordinatorMock.i_wei_per_unit_link();
                        expect(weiPerUnitLink).to.be.equals(
                            vrfCoordinatorMockParams.weiPerUnitLink,
                        );
                    });
                    it("Should have created a subscription", async () => {
                        const activeSubscriptionIdList =
                            await vrfCoordinatorMock.getActiveSubscriptionIds(
                                0, // Start index
                                100, // Max count
                            );
                        expect(activeSubscriptionIdList.length).to.be.gte(1);
                    });
                    it("Should have the deployer as subscription owner", async () => {
                        const activeSubscriptionIdList =
                            await vrfCoordinatorMock.getActiveSubscriptionIds(
                                0, // Start index
                                100, // Max count
                            );
                        const latestSubscriptionId =
                            activeSubscriptionIdList[
                                activeSubscriptionIdList.length - 1
                            ];
                        const { subOwner } =
                            await vrfCoordinatorMock.getSubscription(
                                latestSubscriptionId,
                            );
                        expect(subOwner).to.be.equals(deployer.address);
                    });
                    it("Should have funded the subscription", async () => {
                        const activeSubscriptionIdList =
                            await vrfCoordinatorMock.getActiveSubscriptionIds(
                                0, // Start index
                                100, // Max count
                            );
                        const latestSubscriptionId =
                            activeSubscriptionIdList[
                                activeSubscriptionIdList.length - 1
                            ];
                        const { balance } =
                            await vrfCoordinatorMock.getSubscription(
                                latestSubscriptionId,
                            );
                        expect(balance).to.be.equals(
                            vrfCoordinatorMockParams.subFund,
                        );
                    });
                    it("Should have added main contract as consumer", async () => {
                        const activeSubscriptionIdList =
                            await vrfCoordinatorMock.getActiveSubscriptionIds(
                                0, // Start index
                                100, // Max count
                            );
                        const latestSubscriptionId =
                            activeSubscriptionIdList[
                                activeSubscriptionIdList.length - 1
                            ];
                        const { consumers } =
                            await vrfCoordinatorMock.getSubscription(
                                latestSubscriptionId,
                            );
                        expect(consumers[0]).to.be.equals(randomIpfsNftAddress);
                    });
                });
                describe("RandomIpfsNft", () => {
                    it("Should have the correct token name", async () => {
                        const tokenName = await randomIpfsNft.name();
                        expect(tokenName).to.be.equals(
                            randomIpfsNftParams.name,
                        );
                    });
                    it("Should have the correct token symbol", async () => {
                        const tokenSymbol = await randomIpfsNft.symbol();
                        expect(tokenSymbol).to.be.equals(
                            randomIpfsNftParams.symbol,
                        );
                    });
                    it("Should have the correct VRFCoordinator", async () => {
                        const vrfCoordinatorAddress =
                            await randomIpfsNft.getVrfCoordinator();
                        expect(vrfCoordinatorAddress).to.be.equals(
                            vrfCoordinatorMockAddress,
                        );
                    });
                    it("Should have a valid subscription id", async () => {
                        const subscriptionId =
                            await randomIpfsNft.getSubscriptionId();
                        const activeSubscriptionIdList =
                            await vrfCoordinatorMock.getActiveSubscriptionIds(
                                0, // Start index
                                100, // Max count
                            );
                        const latestSubscriptionId =
                            activeSubscriptionIdList[
                                activeSubscriptionIdList.length - 1
                            ];
                        expect(subscriptionId).to.be.equals(
                            latestSubscriptionId,
                        );
                    });
                    it("Should have the correct keyHash", async () => {
                        const keyHash = await randomIpfsNft.getKeyHash();
                        expect(keyHash).to.be.equals(
                            vrfConsumerParams[currentNetwork].keyHash,
                        );
                    });
                    it("Should have the correct callbackGasLimit", async () => {
                        const callbackGasLimit =
                            await randomIpfsNft.getCallbackGasLimit();
                        expect(callbackGasLimit).to.be.equals(
                            vrfConsumerParams[currentNetwork].callbackGasLimit,
                        );
                    });
                    it("Should have the correct requestConfirmations", async () => {
                        const requestConfirmations =
                            await randomIpfsNft.getRequestConfirmations();
                        expect(requestConfirmations).to.be.equals(
                            vrfConsumerParams[currentNetwork]
                                .requestConfirmations,
                        );
                    });
                    it("Should have the correct numWords", async () => {
                        const numWords = await randomIpfsNft.getNumWords();
                        expect(numWords).to.be.equals(
                            vrfConsumerParams[currentNetwork].numWords,
                        );
                    });
                    it("Should have the correct mintFee", async () => {
                        const mintFee = await randomIpfsNft.getMintFee();
                        expect(mintFee).to.be.equals(
                            randomIpfsNftParams.mintFee,
                        );
                    });
                    it("Should have the correct tokenUris", async () => {
                        const tokenUris = await randomIpfsNft.getTokenUris();
                        expect(tokenUris[0]).to.be.equals(
                            randomIpfsNftParams.tokenURIs[0],
                        );
                        expect(tokenUris[1]).to.be.equals(
                            randomIpfsNftParams.tokenURIs[1],
                        );
                        expect(tokenUris[2]).to.be.equals(
                            randomIpfsNftParams.tokenURIs[2],
                        );
                    });
                    /**
                     * This test is dependent on the connection to pinata, it may be taking long
                     */
                    it.skip("Should have the correct tokenUri for each token tier", async () => {
                        const tier0TokenUri =
                            await randomIpfsNft.getTokenUriOfTier(0);
                        const tier0Cid = tier0TokenUri.split("ipfs://")[1];
                        const tier1TokenUri =
                            await randomIpfsNft.getTokenUriOfTier(1);
                        const tier1Cid = tier1TokenUri.split("ipfs://")[1];
                        const tier2TokenUri =
                            await randomIpfsNft.getTokenUriOfTier(2);
                        const tier2Cid = tier2TokenUri.split("ipfs://")[1];

                        const tier0PinataResponse =
                            await pinata.gateways.public.get(tier0Cid);
                        const tier1PinataResponse =
                            await pinata.gateways.public.get(tier1Cid);
                        const tier2PinataResponse =
                            await pinata.gateways.public.get(tier2Cid);

                        expect(tier0PinataResponse.data["name"]).to.be.equals(
                            "BORDER_COLLIE",
                        );
                        expect(tier1PinataResponse.data["name"]).to.be.equals(
                            "SHIBA_INU",
                        );
                        expect(tier2PinataResponse.data["name"]).to.be.equals(
                            "CHIHUAHUA",
                        );
                    });
                    it("Should have token count 0", async () => {
                        const tokenCount =
                            await randomIpfsNft.getTokenCounter();
                        expect(tokenCount).to.be.equals(0);
                    });
                });
            });
            describe("Functionalities", () => {
                let minter0, minter1, minter2;
                const enoughFee = ethers.parseEther("0.01");
                const notEnoughFee = ethers.parseEther("0.009");

                async function requestAndFulfill(minter) {
                    const currentBlockNumber =
                        await ethers.provider.getBlockNumber();
                    await randomIpfsNft
                        .connect(minter)
                        .requestNft({ value: enoughFee });

                    let requestId;
                    const randomIpfsNftRequestedEventFilter =
                        randomIpfsNft.filters.NftRequested();
                    const randomIpfsNftRequestedEvents =
                        await randomIpfsNft.queryFilter(
                            randomIpfsNftRequestedEventFilter,
                            currentBlockNumber,
                        );
                    requestId = randomIpfsNftRequestedEvents[0].args.requestId;

                    await vrfCoordinatorMock.fulfillRandomWords(
                        requestId,
                        randomIpfsNftAddress,
                    );
                }

                beforeEach(async () => {
                    [, minter0, minter1, minter2] = availableAccounts;
                });

                describe("Minting", () => {
                    it("Should setup the correct chance array", async () => {
                        const chances = await randomIpfsNft.getChanceArray();
                        expect(chances[0]).to.be.equals(5);
                        expect(chances[1]).to.be.equals(30);
                        expect(chances[2]).to.be.equals(100);
                    });
                    it("Should provide the correct token tier 0", async () => {
                        for (
                            let simTierRandomNum = 100;
                            simTierRandomNum <= 104;
                            simTierRandomNum++
                        ) {
                            const tierForTierRandomNum =
                                await randomIpfsNft.getTier(simTierRandomNum);

                            try {
                                expect(tierForTierRandomNum).to.be.equals(0);
                            } catch (error) {
                                if (!error.matchResult) {
                                    console.log(
                                        `Mismatch for \`simTierRandomNum\`: ${simTierRandomNum}`,
                                    );
                                } else {
                                    console.error(error);
                                }
                                throw error;
                            }
                        }
                    });
                    it("Should provide the correct token tier 1", async () => {
                        for (
                            let simTierRandomNum = 105;
                            simTierRandomNum <= 129;
                            simTierRandomNum++
                        ) {
                            const tierForTierRandomNum =
                                await randomIpfsNft.getTier(simTierRandomNum);

                            try {
                                expect(tierForTierRandomNum).to.be.equals(1);
                            } catch (error) {
                                if (!error.matchResult) {
                                    console.log(
                                        `Mismatch for \`simTierRandomNum\`: ${simTierRandomNum}`,
                                    );
                                } else {
                                    console.error(error);
                                }
                                throw error;
                            }
                        }
                    });
                    it("Should provide the correct token tier 2", async () => {
                        for (
                            let simTierRandomNum = 130;
                            simTierRandomNum < 199;
                            simTierRandomNum++
                        ) {
                            const tierForTierRandomNum =
                                await randomIpfsNft.getTier(simTierRandomNum);

                            try {
                                expect(tierForTierRandomNum).to.be.equals(2);
                            } catch (error) {
                                if (!error.matchResult) {
                                    console.error(
                                        `Mismatch for \`simTierRandomNum\`: ${simTierRandomNum}`,
                                    );
                                } else {
                                    console.error(error);
                                }
                                throw error;
                            }
                        }
                    });
                    it("Should revert if not enough mint fee sent", async () => {
                        await expect(
                            randomIpfsNft
                                .connect(minter0)
                                .requestNft({ value: notEnoughFee }),
                        ).to.be.revertedWithCustomError(
                            randomIpfsNft,
                            "RandomIpfsNft__NotEnoughFee",
                        );
                    });
                    it("Should return a request id when minting", async () => {
                        await randomIpfsNft
                            .connect(minter0)
                            .requestNft({ value: enoughFee });
                        /* const requestId = await randomIpfsNft
                            .connect(minter0)
                            .requestNft.staticCall({ value: enoughFee }); */
                        const currentBlockNumber =
                            await ethers.provider.getBlockNumber();
                        const requestNftEventFilter =
                            randomIpfsNft.filters.NftRequested();
                        const requestNftEvents =
                            await randomIpfsNft.queryFilter(
                                requestNftEventFilter,
                                currentBlockNumber,
                            );
                        const requestId = requestNftEvents[0].args.requestId;

                        expect(requestId).to.be.not.undefined;
                    });
                    it("Should emit a `NftRequested` event", async () => {
                        await randomIpfsNft
                            .connect(minter0)
                            .requestNft({ value: enoughFee });

                        const currentBlockNumber =
                            await ethers.provider.getBlockNumber();
                        const requestNftEventFilter =
                            randomIpfsNft.filters.NftRequested();
                        const requestNftEvents =
                            await randomIpfsNft.queryFilter(
                                requestNftEventFilter,
                                currentBlockNumber,
                            );
                        const requestId = requestNftEvents[0].args.requestId;
                        const sender = requestNftEvents[0].args.sender;

                        expect(requestId).to.be.not.undefined;
                        expect(sender).to.be.equals(minter0.address);
                    });
                    it("Should emit a `NftFulfilled` event upon finishing", async () => {
                        await randomIpfsNft
                            .connect(minter0)
                            .requestNft({ value: enoughFee });

                        let requestId;
                        const randomIpfsNftRequestedEventFilter =
                            randomIpfsNft.filters.NftRequested();
                        const randomIpfsNftRequestedEvents =
                            await randomIpfsNft.queryFilter(
                                randomIpfsNftRequestedEventFilter,
                            );
                        requestId =
                            randomIpfsNftRequestedEvents[0].args.requestId;

                        await vrfCoordinatorMock.fulfillRandomWords(
                            requestId,
                            randomIpfsNftAddress,
                        );

                        const currentBlockNumber =
                            await ethers.provider.getBlockNumber();
                        const randomIpfsNftFulfilledEventFilter =
                            randomIpfsNft.filters.NftFulfilled();
                        const randomIpfsNftFulfilledEvents =
                            await randomIpfsNft.queryFilter(
                                randomIpfsNftFulfilledEventFilter,
                                currentBlockNumber,
                            );
                        const fulfilledRequestId =
                            randomIpfsNftFulfilledEvents[0].args.requestId;
                        const fulfilledMinter =
                            randomIpfsNftFulfilledEvents[0].args.minter;
                        const fulfilledBreed =
                            randomIpfsNftFulfilledEvents[0].args.breed;
                        const fulfilledRandomNums =
                            randomIpfsNftFulfilledEvents[0].args.rawResults;

                        expect(fulfilledRequestId).to.be.equals(requestId);
                        expect(fulfilledMinter).to.be.equals(minter0.address);
                        expect(fulfilledBreed).to.be.within(0, 2);
                        expect(fulfilledRandomNums).to.be.not.undefined;
                    });
                    it("Should record the requester for the request id", async () => {
                        await randomIpfsNft
                            .connect(minter0)
                            .requestNft({ value: enoughFee });

                        const requestNftEventFilter =
                            randomIpfsNft.filters.NftRequested();
                        const requestNftEvents =
                            await randomIpfsNft.queryFilter(
                                requestNftEventFilter,
                            );
                        const requestId = requestNftEvents[0].args.requestId;
                        const recordedRequester =
                            await randomIpfsNft.getTokenRequester(requestId);
                        expect(recordedRequester).to.be.equals(minter0.address);
                    });
                    it("Should get a random number for minting", async () => {
                        // Set up listener
                        await new Promise(async (resolve, reject) => {
                            randomIpfsNft.once("NftFulfilled", async () => {
                                try {
                                    const currentBlockNumber =
                                        await ethers.provider.getBlockNumber();
                                    const randomIpfsNftRequestedEventFilter =
                                        randomIpfsNft.filters.NftFulfilled();
                                    const randomIpfsNftRequestedEvents =
                                        await randomIpfsNft.queryFilter(
                                            randomIpfsNftRequestedEventFilter,
                                            currentBlockNumber,
                                        );
                                    const randomNum =
                                        randomIpfsNftRequestedEvents[0].args
                                            .rawResults[0];
                                    expect(randomNum).to.be.not.undefined;
                                } catch (error) {
                                    if (!error.matchResult) {
                                        reject(error);
                                    }
                                }
                                resolve();
                            });

                            await requestAndFulfill(minter0);
                        });
                    });
                    it("Should correctly mint a token", async () => {
                        const minter0BalanceBefore =
                            await randomIpfsNft.balanceOf(minter0.address);

                        await new Promise(async (resolve, reject) => {
                            randomIpfsNft.once("NftFulfilled", async () => {
                                try {
                                    const minter0BalanceAfter =
                                        await randomIpfsNft.balanceOf(
                                            minter0.address,
                                        );
                                    expect(minter0BalanceAfter).to.be.equals(
                                        minter0BalanceBefore + 1n,
                                    );
                                } catch (error) {
                                    if (!error.matchResult) {
                                        reject(error);
                                    }
                                }
                                resolve();
                            });

                            await requestAndFulfill(minter0);
                        });
                    });
                    it("Should correctly map the token owner based on requestId", async () => {
                        await new Promise(async (resolve, reject) => {
                            randomIpfsNft.once("NftFulfilled", async () => {
                                try {
                                    const currentBlockNumber =
                                        await ethers.provider.getBlockNumber();
                                    const randomIpfsNftFulfilledEventFilter =
                                        randomIpfsNft.filters.NftFulfilled();
                                    const randomIpfsNftFulfilledEvents =
                                        await randomIpfsNft.queryFilter(
                                            randomIpfsNftFulfilledEventFilter,
                                            currentBlockNumber,
                                        );
                                    const tokenId =
                                        randomIpfsNftFulfilledEvents[0].args
                                            .tokenId;
                                    const tokenOwner =
                                        await randomIpfsNft.ownerOf(tokenId);
                                    expect(tokenOwner).to.be.equals(
                                        minter0.address,
                                    );
                                } catch (error) {
                                    if (!error.matchResult) {
                                        reject(error);
                                    }
                                }
                                resolve();
                            });

                            await requestAndFulfill(minter0);
                        });
                    });

                    it("Should correctly map the token to its uri", async () => {
                        await new Promise(async (resolve, reject) => {
                            randomIpfsNft.once("NftFulfilled", async () => {
                                try {
                                    const currentBlockNumber =
                                        await ethers.provider.getBlockNumber();
                                    const randomIpfsNftFulfilledEventFilter =
                                        randomIpfsNft.filters.NftFulfilled();
                                    const randomIpfsNftFulfilledEvents =
                                        await randomIpfsNft.queryFilter(
                                            randomIpfsNftFulfilledEventFilter,
                                            currentBlockNumber,
                                        );
                                    const tokenId =
                                        randomIpfsNftFulfilledEvents[0].args
                                            .tokenId;
                                    const tokenBreed =
                                        randomIpfsNftFulfilledEvents[0].args
                                            .breed;

                                    const correctUri =
                                        randomIpfsNftParams.tokenURIs[
                                            tokenBreed
                                        ];
                                    const storedUri =
                                        await randomIpfsNft.getTokenUriOfTier(
                                            tokenBreed,
                                        );
                                    const actualUri =
                                        await randomIpfsNft.tokenURI(tokenId);
                                    expect(actualUri).to.be.equals(storedUri);
                                    expect(actualUri).to.be.equals(correctUri);
                                } catch (error) {
                                    if (!error.matchResult) {
                                        reject(error);
                                    }
                                }
                                resolve();
                            });

                            await requestAndFulfill(minter0);
                        });
                    });

                    it("Should correctly increment the token counter", async () => {
                        const tokenCounterBefore =
                            await randomIpfsNft.getTokenCounter();
                        await new Promise(async (resolve, reject) => {
                            randomIpfsNft.once("NftFulfilled", async () => {
                                try {
                                    const tokenCounterAfter =
                                        await randomIpfsNft.getTokenCounter();
                                    expect(tokenCounterAfter).to.be.equals(
                                        tokenCounterBefore + 1n,
                                    );
                                } catch (error) {
                                    if (!error.matchResult) {
                                        reject(error);
                                    }
                                }

                                resolve();
                            });

                            await requestAndFulfill(minter0);
                        });
                    });
                });
                describe("Withdraw", () => {
                    beforeEach(async () => {
                        await requestAndFulfill(minter0);
                        await requestAndFulfill(minter1);
                        await requestAndFulfill(minter2);
                    });
                    it("Should revert if withdrawer is not the deployer", async () => {
                        await expect(
                            randomIpfsNft.connect(minter0).withdraw(),
                        ).to.be.revertedWith("Only callable by owner");
                    });
                    it("Should transfer balance to the deployer", async () => {
                        const initialDeployerBalance = initialBalanceMap.get(
                            deployer.address,
                        );
                        const initialContractBalance =
                            await ethers.provider.getBalance(
                                randomIpfsNftAddress,
                            );

                        await randomIpfsNft.connect(deployer).withdraw();

                        const finalContractBalance =
                            await ethers.provider.getBalance(
                                randomIpfsNftAddress,
                            );
                        const finalDeployerBalance =
                            await ethers.provider.getBalance(deployer.address);
                        expect(finalContractBalance).to.be.equals(0);
                        expect(finalDeployerBalance).to.be.gte(
                            initialDeployerBalance,
                        );
                    });
                });
            });
        });
    });
}
