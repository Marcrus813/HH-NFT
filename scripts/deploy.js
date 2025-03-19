const randomIpfsNftModule = require("../ignition/modules/randomIpfsNft");
const svgNftModule = require("../ignition/modules/svgNft");

const { ignition } = require("hardhat");
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata");
const {
    metadataTemplate,
} = require("../resources/metadata/randomIpfsNft.template");
const { tokenTireMap } = require("../configs/contract/randomIpfsNftParams");

const tokenImagesDir = "../resources/images/";
const contractIndex = process.env.CONTRACT_INDEX || "0";

const useCustomTokenUris = process.env.CUSTOM_TOKEN || "false";
const customTokenFlag = useCustomTokenUris === "true";

async function getIpfsTokenUris() {
    let tokenUris = ["", "", ""];
    const imgSrcDir = tokenImagesDir + "randomIpfsNft";

    // Get the responses of the uploaded images
    const { uploadResponseArray, files } = await storeImages(imgSrcDir);
    for (imageUploadResponse in uploadResponseArray) {
        // In this syntax, imageUploadResponse is the index
        // Create metadata -> upload metadata
        let tokenUriMetadata = { ...metadataTemplate };
        const tokenName = files[imageUploadResponse].replace(".png", "");
        tokenUriMetadata.name = tokenName; // Getting the file name without the extension
        tokenUriMetadata.description = `A ${tokenUriMetadata.name} friend!`;
        tokenUriMetadata.image = `ipfs://${uploadResponseArray[imageUploadResponse].cid}`; // Use cid to retrieve

        // Upload metadata
        const metadataUploadResponse =
            await storeTokenUriMetadata(tokenUriMetadata);
        const tokenTierMap = tokenTireMap();
        const tier = tokenTierMap.get(tokenName.toLowerCase());
        if (metadataUploadResponse) {
            tokenUris[tier] = `ipfs://${metadataUploadResponse.cid}`;
        }
    }
    console.log(tokenUris);

    return tokenUris;
}

async function deployRandomIpfsNft() {
    if (customTokenFlag) {
        const tokenUris = await getIpfsTokenUris();

        const { randomIpfsNft } = await ignition.deploy(randomIpfsNftModule, {
            parameters: {
                RandomIpfsNft: { tokenUris },
            },
        });
        console.log(`RandomIpfsNft deployed to: ${randomIpfsNft.target}`);
    } else {
        const { randomIpfsNft } = await ignition.deploy(randomIpfsNftModule);
        console.log(`RandomIpfsNft deployed to: ${randomIpfsNft.target}`);
    }
}

async function deploySvgNft() {
    await ignition.deploy(svgNftModule);
}

async function main() {
    switch (contractIndex) {
        case "1":
            await deployRandomIpfsNft();
            break;

        case "2":
            await deploySvgNft();
            break;

        case "all":
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
