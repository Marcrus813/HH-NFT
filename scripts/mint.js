const { ethers, ignition } = require("hardhat");
const fs = require("fs");
const path = require("path");

const randomIpfsNftModule = require("../ignition/modules/randomIpfsNft");
const svgNftModule = require("../ignition/modules/svgNft");

const randomMintFee = ethers.parseEther("0.01");
const svgMintFee = ethers.parseEther("0.05");

async function main() {
    const randomNftArtifact = JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                "../artifacts/contracts/RandomIpfsNft.sol/RandomIpfsNft.json",
            ),
            "utf-8",
        ),
    );
    const randomNftAbi = randomNftArtifact.abi;
    const randomNftInterface = new ethers.Interface(randomNftAbi);

    const svgNftArtifact = JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                "../artifacts/contracts/SvgNft.sol/SvgNft.json",
            ),
            "utf-8",
        ),
    );
    const svgNftAbi = svgNftArtifact.abi;
    const svgNftInterface = new ethers.Interface(svgNftAbi);

    const [deployer] = await ethers.getSigners();

    console.log("Getting Random IPFS NFT contract...");

    const randomIpfsNftDeployments = await ignition.deploy(randomIpfsNftModule);
    const randomIpfsNft = randomIpfsNftDeployments.randomIpfsNft;
    const randomIpfsNftAddress = await randomIpfsNft.getAddress();
    console.log(
        `Random IPFS NFT contract deployed to: ${randomIpfsNftAddress}`,
    );

    console.log("Getting SVG NFT contract...");
    const svgNftDeployments = await ignition.deploy(svgNftModule);
    const svgNft = svgNftDeployments.svgNft;
    const svgNftAddress = await svgNft.getAddress();
    console.log(`SVG NFT contract deployed to: ${svgNftAddress}`);

    console.log("Minting NFTs...");
    console.log("Minting Random IPFS NFT");

    await new Promise(async (resolve, reject) => {
        randomIpfsNft.once("NftFulfilled", async () => {
            resolve();
        });

        try {
            const requestRandomNftTxn = await randomIpfsNft
                .connect(deployer)
                .requestNft({
                    value: randomMintFee,
                });
            const requestRandomNftTxnReceipt = requestRandomNftTxn.wait(1);
        } catch (error) {
            const decoded = randomNftInterface.parseError(error.data);
            console.log(decoded);
            reject();
        }
    });

    /* const threshold = 100000000000n;
    console.log(`Minting SVG NFT with threshold: ${threshold}`);
    let mintSvgNftTxn;
    try {
        mintSvgNftTxn = await svgNft.connect(deployer).mintNft(threshold, {
            value: svgMintFee,
        });
    } catch (error) {
        const decoded = svgNftInterface.parseError(error.data);
        console.log(decoded);
    }
    const mintSvgNftTxnReceipt = await mintSvgNftTxn.wait(1); */

    console.log("NFTs minted successfully!");

    console.log("Withdrawing funds...");
    await randomIpfsNft.connect(deployer).withdraw();
    await svgNft.connect(deployer).withdraw();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
