# NFT

## Basics

- Definition
    - Non-Fungible Token, ERC-721
        - Keyword: Fungible -> 1 USD = (any other) 1 USD, Non-Fungible -> Each is unique
    - ERC-721
        - Compared to ERC-20, each token has a ID stored in a mapping to owner, there's also a token URI
            ```solidity
            mapping(uint256 => address) private _owners
            ```
        - MetaData
            - Stores unique stats, some may be big => costs gas => URI comes in
        - URI (Universal Resource Identifier)
            - A string pointing to asset(off-chain metadata)
            - IPFS
                - Semi-on-chain mechanism to store data
            - Get IPFS => Add token URI json file to IPFS => Add IPFS URI to NFT URI

## Coding

- Inheritance
    - Different from ERC-20, ERC-721 includes some extensions, we can chose from based on our needs(URI based? Burnable?)
- Minting
    - Same as ERC-20: mint to create initial supply
    - Initially, the token does not look like anything
- `tokenURI`
    - Returns json like:
    ```json
    {
        "title": "Asset Metadata",
        "type": "object",
        "properties": {
            "name": {
                "type": "string",
                "description": "Identifies the asset to which this NFT represents"
            },
            "description": {
                "type": "string",
                "description": "Describes the asset to which this NFT represents"
            },
            "image": {
                "type": "string",
                "description": "A URI pointing to a resource with mime type image/* representing the asset to which this NFT represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
            }
        }
    }
    ```
    To use IPFS link directly on browser, need to install IPFS companion for chrome on browser, [install link](https://chromewebstore.google.com/detail/ipfs-companion/nibjojkomfdiaoajekhjakgkdhaomnch)
    - Can I set the uri on deploy?
        - **NOTE**
            - `string` is not supported as immutable, for it has to point to a value, so it could be the same for other reference types(array, map)
    - For these assets, storing decentralized is preferred, so it is best practice to use `ipfs://` instead of `https`
