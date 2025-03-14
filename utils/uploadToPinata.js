const { PinataSDK } = require("pinata");
const path = require("path");
const fs = require("fs");

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY_URL,
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
            console.log(`Uploading ${files[fileIndex]} to Pinata...`);
            const response = await uploadFileToPinataWithRetry(uploadFile, 5);
            uploadResponseArray.push(response);
            console.log(`SUCCESS: Uploaded ${files[fileIndex]} to Pinata`);
        } catch (error) {
            console.log(
                `FAIL: Error uploading ${files[fileIndex]}: ${error.message}`,
            );
        }
    }

    return { uploadResponseArray, files };
}

async function uploadFileToPinataWithRetry(uploadFile, retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await pinata.upload.public.file(uploadFile);
            return response;
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.log(`Retrying upload (${attempt}/${retries})...`);
        }
    }
}

async function storeTokenUriMetadata(metadata) {
    console.log(`Uploading metadata: ${metadata.name}`);
    try {
        const options = {
            metadata: {
                name: metadata.name,
            }
        }
        const response = await pinata.upload.public.json(metadata, options);
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
