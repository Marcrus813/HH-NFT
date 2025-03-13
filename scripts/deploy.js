const randomIpfsNftModule = require("../ignition/modules/randomIpfsNft");
const { ignition } = require("hardhat");
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadImageToPinata");
const {
    metadataTemplate,
} = require("../resources/metadata/randomIpfsNft.template");

const tokenImagesDir = "../resources/images/";
const contractIndex = process.env.CONTRACT_INDEX || "0";

async function getIpfsTokenUris() {
    let tokenUris = ["", "", ""];
    const imgSrcDir = tokenImagesDir + "randomIpfsNft";

    // Get the responses of the uploaded images
    const { uploadResponseArray, files } = await storeImages(imgSrcDir);
    for (imageUploadResponse in uploadResponseArray) { // In this syntax, imageUploadResponse is the index
        // Create metadata -> upload metadata
        let tokenUriMetadata = {...metadataTemplate};
        tokenUriMetadata.name = files[imageUploadResponse].replace(".png", ""); // Getting the file name without the extension
        tokenUriMetadata.description = `A ${tokenUriMetadata.name} friend!`;
        tokenUriMetadata.image = `ipfs://${uploadResponseArray[imageUploadResponse].cid}`; // Use cid to retrieve

        // Upload metadata
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
        if (metadataUploadResponse) {
            tokenUris[Number(imageUploadResponse)] = `ipfs://${metadataUploadResponse.cid}`;
        }
    }
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
