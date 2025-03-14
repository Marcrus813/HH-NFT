const randomIpfsNftParams = {
    name: "Random IPFS NFT",
    symbol: "RIN",
    tokenURIs: [
        "ipfs://bafkreidawxdhws67ahvlxdn5kasblg2e256erhtqyhj745sqbznfprexje",
        "ipfs://bafkreid3azhpm6poygfo37p35vavnu4eqsebhg7il6p3pgo4feydnjrvge",
        "ipfs://bafkreiekfwvjvio5nb6zl6xg2g666oc5yzwv2vcx3jfegnw3iswduik5cu",
    ],
    mintFee: 10000000000000000n, //0.01 * 10 ** 18
};

function tokenTireMap() {
    let tokenTier = new Map();
    let tokenNames = ["border_collie", "shiba_inu", "chihuahua"];
    for (let index = 0; index < tokenNames.length; index++) {
        const tokenName = tokenNames[index];
        tokenTier.set(tokenName, index);
    }
    return tokenTier;
}

module.exports = {
    randomIpfsNftParams,
    tokenTireMap,
};
