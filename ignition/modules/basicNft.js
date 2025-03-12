const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { constructorParams } = require("../../configs/resource/basicNftParams");
const {
    chainIds,
    networkConfig,
    devChains,
} = require("../../configs/network/network-config");

module.exports = buildModule("BasicNftModule", (m) => {
    const network = process.env.NETWORK || "hardhat";
    const localFlag = devChains.includes(network);
    const chainId = chainIds[network];
    const { name, symbol } = constructorParams;

    let basicNft;
    switch (localFlag) {
        case true:
            basicNft = m.contract("BasicNft", [name, symbol]);
            return { basicNft };

        default:
            basicNft = m.contract("BasicNft", [name, symbol], { verify: true });
            return { basicNft };
    }
});
