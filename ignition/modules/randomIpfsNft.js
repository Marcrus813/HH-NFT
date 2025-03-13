const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const {
    vrfCoordinatorMockParams,
    vrfConsumerParams,
} = require("../../configs/contract/vrfParams");
const {
    randomIpfsNftParams,
} = require("../../configs/contract/randomIpfsNftParams");
const { devChains } = require("../../configs/network/network-config");

const currentNetwork = process.env.NETWORK || "hardhat";
const localFlag = devChains.includes(currentNetwork);

const useCustomTokenUris = process.env.CUSTOM_TOKEN || "false";
const customTokenFlag = useCustomTokenUris === "true";

module.exports = buildModule("RandomIpfsNft", (m) => {
    let randomIpfsNft;
    let nftParams;
    const vrfParams = vrfConsumerParams[currentNetwork];
    let vrfCoordinatorMock;
    let tokenUris = customTokenFlag
        ? m.getParameter("tokenUris")
        : randomIpfsNftParams.tokenURIs;
    switch (localFlag) {
        case true:
            const mockParams = [
                vrfCoordinatorMockParams.baseFee,
                vrfCoordinatorMockParams.gasPrice,
                vrfCoordinatorMockParams.weiPerUnitLink,
            ];
            vrfCoordinatorMock = m.contract(
                "VRFCoordinatorV2_5Mock",
                mockParams,
            );

            // Create subscription
            const createSubscriptionFuture = m.call(
                vrfCoordinatorMock,
                "createSubscription",
                [],
                { after: [vrfCoordinatorMock] },
            );
            const subId = m.readEventArgument(
                createSubscriptionFuture,
                "SubscriptionCreated",
                "subId",
            );

            // Fund subscription
            const fundSubscriptionFuture = m.call(
                vrfCoordinatorMock,
                "fundSubscription",
                [subId, vrfCoordinatorMockParams.subFund],
                {
                    after: [vrfCoordinatorMock, createSubscriptionFuture],
                },
            );

            // Deploy RandomIpfsNft contract
            nftParams = [
                randomIpfsNftParams.name,
                randomIpfsNftParams.symbol,
                vrfCoordinatorMock,
                subId,
                vrfParams.keyHash,
                vrfParams.callbackGasLimit,
                vrfParams.requestConfirmations,
                vrfParams.numWords,
                randomIpfsNftParams.mintFee,
                tokenUris,
            ];

            randomIpfsNft = m.contract("RandomIpfsNft", nftParams, {
                after: [
                    vrfCoordinatorMock,
                    createSubscriptionFuture,
                    fundSubscriptionFuture,
                ],
            });

            // Add consumer
            m.call(vrfCoordinatorMock, "addConsumer", [subId, randomIpfsNft], {
                after: [
                    vrfCoordinatorMock,
                    createSubscriptionFuture,
                    fundSubscriptionFuture,
                    randomIpfsNft,
                ],
            });

            return { randomIpfsNft, vrfCoordinatorMock };

        default:
            nftParams = [
                randomIpfsNftParams.name,
                randomIpfsNftParams.symbol,
                vrfParams.vrfCoordinatorAddress,
                vrfParams.subscriptionId,
                vrfParams.keyHash,
                vrfParams.callbackGasLimit,
                vrfParams.requestConfirmations,
                vrfParams.numWords,
                randomIpfsNftParams.mintFee,
                tokenUris,
            ];

            randomIpfsNft = m.contract("RandomIpfsNft", nftParams, {
                verify: true,
            });

            return { randomIpfsNft };
    }
});
