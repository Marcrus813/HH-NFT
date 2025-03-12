// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    uint256 private s_tokenCounter;
    string private constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        s_tokenCounter = 0;
    }

    function mintNft() public returns (uint256 tokenCounter) {
        _safeMint(msg.sender, s_tokenCounter); // Mint: `to`: msg.sender, give it Id as the counter
        s_tokenCounter++;
        tokenCounter = s_tokenCounter;
    }

    function tokenURI(
        uint256 /* tokenId */
    ) public pure override returns (string memory tokenUri) {
        tokenUri = TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256 result) {
        result = s_tokenCounter;
    }
}
