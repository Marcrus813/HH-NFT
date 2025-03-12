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
        - URI
            - A string pointing to asset(off-chain metadata)
            - IPFS
                - Semi-on-chain mechanism to store data
            - Get IPFS => Add token URI json file to IPFS => Add IPFS URI to NFT URI
