const addresses = {
    address: {
        ethUsd: {
            mainnet: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
            sepolia: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        },
    },

};

const mockParams = {
    pair: "ETH/USD",
    decimals: 8,
    initialAnswer: 200000000000,
};

module.exports = { addresses, mockParams };
