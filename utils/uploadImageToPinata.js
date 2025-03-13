const { PinataSDK } = require("pinata");
const path = require("path");
const fs = require("fs");

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
});

async function storeImages(imageSrcDir) {
    const imgDirFullPath = path.resolve(__dirname, imageSrcDir);
    const files = fs.readdirSync(imgDirFullPath);
    let uploadResponseArray = [];
    for (fileIndex in files) {
        const imgDir = `${imgDirFullPath}/${files[fileIndex]}`;
        const fileBlob = new Blob([fs.readFileSync(imgDir)]);
        const uploadFile = new File([fileBlob], files[fileIndex], {
            type: "image/png",
        });

        try {
            const response = await pinata.upload.public.file(uploadFile);
            uploadResponseArray.push(response);
            console.log(`Uploaded ${files[fileIndex]} to Pinata`);
        } catch (error) {
            console.log(
                `Error uploading ${files[fileIndex]}: ${error.message}`,
            );
        }
    }

    return { uploadResponseArray, files };
}

async function storeTokenUriMetadata(metadata) {
    console.log(`Uploading metadata: ${metadata.name}`);
    try {
        const response = await pinata.upload.public.json(metadata);
        return response;
    } catch (error) {
        console.log(
            `Error uploading metadata ${metadata.name}: ${error.message}`,
        );
        return null;
    }
}

module.exports = {
    storeImages,
    storeTokenUriMetadata,
};
