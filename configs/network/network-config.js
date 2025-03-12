const chainIds = {
    localhost: 31337,
    hardhat: 31337,
    sepolia: 11155111,
    mainnet: 1,
};

const networkConfig = {
    11155111: {
        name: "sepolia",
    },
    1: {
        name: "mainnet",
    },
    31337: {
        name: "hardhat",
    },
};

const devChains = ["hardhat", "localhost"];

module.exports = {
    chainIds,
    networkConfig,
    devChains,
};
