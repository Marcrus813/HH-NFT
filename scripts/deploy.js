const randomIpfsNftModule = require("../ignition/modules/randomIpfsNft");
const { ignition } = require("hardhat");
const { storeImages } = require("../utils/uploadImageToPinata");

const tokenImagesDir = "../resources/images/";
const contractIndex = process.env.CONTRACT_INDEX || "0";

async function getIpfsTokenUris() {
    let tokenUris = ["", "", ""];
    const imgSrcDir = tokenImagesDir + "randomIpfsNft";
    await storeImages(imgSrcDir);
    return tokenUris;
}

async function deployRandomIpfsNft() {
    const tokenUris = await getIpfsTokenUris();

    const { randomIpfsNft } = await ignition.deploy(randomIpfsNftModule, {
        parameters: {
            RandomIpfsNft: { tokenUris },
        },
    });

    console.log(`RandomIpfsNft deployed to: ${randomIpfsNft.target}`);
}

async function main() {
    switch (contractIndex) {
        case "1":
            await deployRandomIpfsNft();
            break;

        case "2":
            break;

        default: // 0
            break;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
