const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const {
    vrfCoordinatorMockParams,
} = require("../../configs/resource/vrfParams");
const { devChains } = require("../../configs/network/network-config");

let currentNetwork = process.env.NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

module.exports = buildModule("vrfCoordinatorMock", (m) => {
    if (localFlag) {
        const baseFee = vrfCoordinatorMockParams.baseFee;
        const gasPrice = vrfCoordinatorMockParams.gasPrice;
        const weiPerUnitLink = vrfCoordinatorMockParams.weiPerUnitLink;

        const vrfCoordinatorMockModule = m.contract("VRFCoordinatorV2_5Mock", [
            baseFee,
            gasPrice,
            weiPerUnitLink,
        ]);

        return { vrfCoordinatorMockModule };
    } else {
        console.log("SKIPPED mock");
    }
});
