const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

async function storeImages(imageSrcDir) {
    const imgDirFullPath = path.resolve(__dirname, imageSrcDir);
    const files = fs.readdirSync(imgDirFullPath);
    console.log(files);
}

async function storeJson(params) {}

module.exports = {
    storeImages,
};
