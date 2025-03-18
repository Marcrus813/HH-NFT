const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const { mockParams } = require("../../configs/contract/aggregatorParams");

const { devChains } = require("../../configs/network/network-config");
let currentNetwork = process.env.HARDHAT_NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

module.exports = buildModule("AggregatorV3Mock", (m) => {
    if (localFlag) {
        const decimals = mockParams.decimals;
        const initialAnswer = mockParams.initialAnswer;
        const aggregatorV3Mock = m.contract("MockV3Aggregator", [
            decimals,
            initialAnswer,
        ]);
        return {aggregatorV3Mock};
    }
});
