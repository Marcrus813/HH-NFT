const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const fs = require("fs");
const path = require("path");

const {
    priceFeeds,
    mockParams,
} = require("../../configs/contract/aggregatorParams");
const { svgNftParams } = require("../../configs/contract/svgNftParams");

const { devChains } = require("../../configs/network/network-config");
let currentNetwork = process.env.NETWORK || "hardhat";
if (currentNetwork === "localhost") {
    currentNetwork = "hardhat";
}
const localFlag = devChains.includes(currentNetwork);

module.exports = buildModule("SvgNftToken", (m) => {
    let svgNft;

    const tokenName = svgNftParams.tokenName;
    const tokenSymbol = svgNftParams.tokenSymbol;

    const sakaSvg = fs.readFileSync(
        path.join(__dirname, "../../resources/images/svgNft/SAKA.svg"),
        "utf-8"
    );
    const mltSvg = fs.readFileSync(
        path.join(__dirname, "../../resources/images/svgNft/MLT.svg"),
        "utf-8",
    );

    const mintFee = svgNftParams.mintFee;

    let svgNftConstructorParams;

    switch (localFlag) {
        case true:
            const mockDecimal = mockParams.decimals;
            const mockInitialAnswer = mockParams.initialAnswer;
            const aggregatorV3Mock = m.contract("MockV3Aggregator", [
                mockDecimal,
                mockInitialAnswer,
            ]);

            svgNftConstructorParams = [
                aggregatorV3Mock,
                tokenName,
                tokenSymbol,
                sakaSvg,
                mltSvg,
                mintFee,
            ];

            svgNft = m.contract(
                "SvgNft",
                [
                    aggregatorV3Mock,
                    tokenName,
                    tokenSymbol,
                    sakaSvg,
                    mltSvg,
                    mintFee,
                ],
                {
                    after: [aggregatorV3Mock],
                },
            );

            return { svgNft, aggregatorV3Mock };

        default:
            const aggregatorV3Address =
                priceFeeds.address.ethUsd[currentNetwork];
            svgNftConstructorParams = [
                aggregatorV3Address,
                tokenName,
                tokenSymbol,
                sakaSvg,
                mltSvg,
                mintFee,
            ];

            svgNft = m.contract("SvgNft", svgNftConstructorParams, {
                verify: true,
            });

            return { svgNft };
    }
});
