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

### Basic NFT

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

### Random IPFS NFT

- Random

    - Mint will trigger VRF -> Random number -> Dice to decide the token
    - Implementation

        - Mapping
            - Currently, `requestNft` gets called, returns a `requestId`, it is not what we need for NFT, we mint the NFT in `fulfillRandomWords` -> Token is owned by chainlink node who fulfilled the random word, so we need to use a mapping to store person who called `requestNft` and the corresponding `requestId`, then use `requestId` in `fulfillRandomWords` to get the actual owner of the token, see code for more info
        - Rarity
            - Basic idea of how to set rarity, see code
            - **NOTE**
                - Solidity `try/catch`: [example](https://www.cyfrin.io/glossary/try-catch-solidity-code-example), it seems that unlike other languages, try/catch can only be used with external function calls
        - Differentiate tokens
            - Now I have tier, we use a enum `Breed` to map the tier to a specified token:
            ```solidity
            enum Breed {
                PUG,
                SHIBA,
                HUSKY
            }
            ```
            Then based on the breed, we can call `_setTokenURI` from `ERC721URIStorage` version from `openzeppelin`, **THIS IS NOT GAS EFFICIENT**, then set the target token URI to which we want
        - **NOTE**
            - [Conflicts between imports](https://ethereum.stackexchange.com/questions/164508/migration-to-vrf-2-5-resolving-conflicts-between-chainlink-vrf-v2-5-and-openze)
                - `_transferOwnership`, `owner()`..., this is because there's an inheritance link: VRFConsumerBaseV2Plus -> ConfirmedOwner -> ConfirmedOwnerWithProposal -> IOwnable, so we don't need `is Ownable`
            - `ERC721URIStorage` has overridden `tokenURI`, so we don't need it anymore
        - Getting our own token URIs:

            > 1. Use our own local IPFS node(Centralized, not preferred, could give it a shot later)
            > 2. Pinata
            > 3. NFT storage(Filecoin)

            Here, we use Pinata - Pinata

            - Process: Store image -> Store metadata
            - **Notes**
                - We will be doing some async functions, since it is not allowed in ignition script, we first construct our ignition script, then write a `deploy.js` in `scripts`, and run it to deploy, see [example](https://hardhat.org/ignition/docs/guides/scripts), since we might have to go by this approach in the future, this may be our only practice from now on(will modify `h-deploy` in `package.json`)
