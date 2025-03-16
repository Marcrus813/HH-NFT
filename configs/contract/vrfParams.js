const vrfConsumerParams = {
    mainnet: {},
    sepolia: {
        subscriptionId:
            "73695224490739830815926182485269773582526809004350983370830623188378858758081",
        vrfCoordinatorAddress: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        keyHash:
            "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // 500 gwei limit key hash, a.k.a `gasLane`
        callbackGasLimit: 8000000,
        requestConfirmations: 3,
        numWords: 1,
    },
    hardhat: {
        keyHash:
            "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callbackGasLimit: 8000000,
        requestConfirmations: 1,
        numWords: 1,
    },
};

const vrfCoordinatorMockParams = {
    baseFee: 100000000000000000n,
    gasPrice: 1000000000n,
    weiPerUnitLink: 7308098166519503n,
    subFund: 100000000000000000000n,
};

module.exports = {
    vrfConsumerParams,
    vrfCoordinatorMockParams,
};
