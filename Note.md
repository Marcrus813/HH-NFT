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

- Pros and cons

    - Pros
        - Cheap
    - Cons
        - Someone needs to pin our data

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
            - Pinata upload
                - I am following [official docs](https://docs.pinata.cloud/frameworks/node-js#upload-a-file-to-pinata) to avoid any possible outdated code in the tutorial, still have questions about possible `options`, response:
                ```json
                {
                    "id": "01958fab-a806-7fbc-a17d-e2efaf23e7b2",
                    "user_id": "98de0cc3-3b79-47b4-a2fa-92458fe5a104",
                    "group_id": null,
                    "name": "border_collie.png",
                    "cid": "bafybeifgbvzmanb2rlw3bqm2etzvfnyiyydvopahele57voh4dz22r3aly", // Use this for imgUri
                    "created_at": "2025-03-13T13:22:27.093Z",
                    "size": 1168288,
                    "number_of_files": 1,
                    "mime_type": "image/png",
                    "vectorized": false,
                    "network": "public"
                }
                ```
                - `options`, see src of `pinata.upload.public.file`
                ```typescript
                type UploadOptions = {
                    metadata?: PinataMetadata;
                    keys?: string;
                    groupId?: string;
                    vectorize?: boolean;
                    url?: string;
                };
                ```
                - **Note**
                    - After this part, I am considering setting up IPFS node on home server
                - Metadata
                    - Template
                    ```javascript
                    {
                        name: "",
                        description: "",
                        image: "",
                        attributes: [ // This should be corresponding to what's in the project
                            {
                                trait_type: "cuteness",
                                value: 100,
                            },
                        ],
                    };
                    ```
                    - General idea
                        - See code: `deploy.js: getIpfsTokenUris`
                            - **Note**
                                - `{...metadataTemplate}` -> Unpack `metadataTemplate`
                    - In the contract, metadata uri is linked to token by `Breed`, so the filename and breed name should be consistent, and the order should be managed, to avoid nested for loop, I am using map
                    - [ ] Problems
                        - [ ] Sometimes file fetch error, so the best practice would be for the first time we call `storeImage` and `storeMetadata`, then print out the uploaded `uri`, then use the uri as static resource

- Test
    - Testing custom deploy
        - Necessary? Only difference between `deploy.js` and plain ignition is that `deploy.js` includes uploading to pinata and setting `tokenUris` dynamically, which could be done separately, and we are testing the contract not the deploy script
    - **NOTE**
        - Problems getting return value from non-view / non-pure functions
            - I tried to get `requestId` from `requestNft`, but in ethers.js I got a transaction response, this is because [(source)](https://ethereum.stackexchange.com/questions/88119/i-see-no-way-to-obtain-the-return-value-of-a-non-view-function-ethers-js):
                > The return value of a non-pure non-view function is available only when the function is called and validated on-chain(Unless use `eth_call` off-chain, it will not change storage permanently, so this is like `callStatic`); When you call such function off-chain (e.g. from an ethers.js script), you need to execute it within a transaction, and the "return value" is the hash of that transaction.
                - So to work around this, I could use emitted event like I am doing now, I can also use `callStatic`(WITH ethers.js V5), explained:
                    > Rather than executing the state-change of a transaction, it is possible to ask a node to pretend that a call is not state-changing and return the result.
                    > This does not actually change any state, but is free. This in some cases can be used to determine if a transaction will fail or succeed.
                    > This otherwise functions the same as a Read-Only Method.
                    - `ethers.js V6` syntax: `contract.functionName.staticCall(params)`
    - [x] Problems
        - [x] VRF is taking forever
            - Some reverts are not displayed, so when encountering unclear problems, it might be helpful to try catch and log error
                ```javascript
                try {
                    const fulfillTxn =
                        await vrfCoordinatorMock.fulfillRandomWords(
                            requestId,
                            randomIpfsNftAddress,
                        );
                    console.log(
                        "Transaction sent, waiting for confirmation...",
                    );
                    await fulfillTxn.wait();
                    console.log("Transaction confirmed!");
                } catch (error) {
                    console.error(
                        "Error while fulfilling random words:",
                        error,
                    );
                }
                ```
                Here, we did not fund the subscription with enough LINK, added amount and it works fine now
        - [x] Getting `InvalidRequest` when minting multiple tokens
            - [x] Possible cause: When getting events, I am using index 0, on later emissions, I will always get the first request, so I need to restrict the range of the filter
                - After adding
                    ```javascript
                    const currentBlockNumber =
                        await ethers.provider.getBlockNumber();
                    const randomIpfsNftRequestedEvents =
                        await randomIpfsNft.queryFilter(
                            randomIpfsNftRequestedEventFilter,
                            currentBlockNumber,
                        );
                    ```
                    it works as expected

### Dynamic SVG NFT

- Pros and cons
    - Pros
        - Data stored on chain
    - Cons
        - Expensive -> Use svg instead of PNG
- Contract layout
    - Mint
    - Store svg
    - Show image based on parameter
- Specify assets
    - Pass URI containing image code to the contract -> Encode svg xml onchain to get Base64
        - After we got base64, we can use: `data:image/svg+xml;base64,${base64}` to get the svg image, this can be done with `base64-sol` on-chain, also off-chain
    - `abi.encodePacked` & `abi.encode`
        - [Solidity cheat sheet docs](https://docs.soliditylang.org/en/latest/cheatsheet.html)
        - See example contract, play with it on remix
    - Got image -> Construct `tokenURI`
        - Construct JSON -> Base64 JSON -> Add prefix: `data:application/json;base64`
    - [x] Problems
        - [x] When deploying, I am getting `TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))` on `m.contract("SvgNft")`
            - [x] `after` object is an array
- Testing
    - Thoughts
        - Best practice to get event from txn?
            - Use `txnReceipt.logs`, then the latest event, if using filters, should also use txnReceipt to get the accurate blocknum the filter, `getBlockNumber` could be inaccurate on mainnet where other txns are being fired
    - Problems
        - When using javascript to construct json, we get double quote, but in our contract, we are using single quote for json, could this lead to problem?
            - Did some testing, imgUri is different, price value is different
                - In my contract, only `stockPrice` is `int256` which won't matter if it were `uint256`, so contract is good to go for now
                - `toString` in solidity? Why it does not exist natively? Why Openzeppelin has only `toString(uint256)` but nothing for `int256`?
            - Image different is cuz used different image
            - Image difference: used wrong logic in test script
            - Output different
                - They actually are, but the decoded results are identical, why and does it matter?
