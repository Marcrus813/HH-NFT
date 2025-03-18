const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const {
    addresses,
    mockParams,
} = require("../../configs/contract/aggregatorParams");
const { svgNftParams } = require("../../configs/contract/svgNftParams");

const { devChains } = require("../../configs/network/network-config");
let currentNetwork = process.env.HARDHAT_NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

module.exports = buildModule("SvgNft", (m) => {
    let svgNft;
    switch (localFlag) {
        case true:
            const mockDecimal = mockParams.decimals;
            const mockInitialAnswer = mockParams.initialAnswer;
            const aggregatorV3Mock = m.contract("MockV3Aggregator", [
                mockDecimal,
                mockInitialAnswer,
            ]);

            const tokenName = svgNftParams.tokenName;
            const tokenSymbol = svgNftParams.tokenSymbol;

            break;

        default:
            break;
    }
});
