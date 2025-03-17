// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";

contract SvgNft is ERC721 {
    string private i_sakaTokenUri;
    string private i_mltTokenUri;

    string private constant BASE64_ENCODED_SVG_PREFIX =
        "data:image/svg+xml;base64,";

    uint256 private s_tokenCounter;
    uint256 private immutable i_mintFee;

    error SvgNft__NotEnoughFee();

    event NftMinted();

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 mintFee
    ) ERC721(tokenName, tokenSymbol) {
        s_tokenCounter = 0;
        i_mintFee = mintFee;
    }

    function svgToImgURI(
        string memory svgXml
    ) public pure returns (string memory result) {
        string memory buffer = Base64.encode(
            bytes(string(abi.encodePacked(svgXml)))
        );
        result = string(abi.encodePacked(BASE64_ENCODED_SVG_PREFIX, buffer));
    }

    modifier enoughFee() {
        if (msg.value < i_mintFee) {
            revert SvgNft__NotEnoughFee();
        }
        _;
    }

    function mintNft() public payable enoughFee {
        // Mint NFT
        address tokenOwner = msg.sender;
        uint256 tokenId = s_tokenCounter;
        _safeMint(tokenOwner, tokenId);
        s_tokenCounter += 1;
        emit NftMinted();
    }

    function getTokenCounter() public view returns (uint256 result) {
        result = s_tokenCounter;
    }
}
