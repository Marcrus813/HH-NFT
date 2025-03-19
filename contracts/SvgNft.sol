// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract SvgNft is ERC721, Ownable {
    AggregatorV3Interface internal immutable i_priceFeed;

    string private constant BASE64_ENCODED_SVG_PREFIX =
        "data:image/svg+xml;base64,";
    string private i_sakaImgUri;
    string private i_sakaTokenUri;
    string private i_mltImgUri;
    string private i_mltTokenUri;

    uint256 private s_tokenCounter;
    uint256 private immutable i_mintFee;
    mapping(uint256 => int256) s_tokenThreshold;

    error SvgNft__NotEnoughFee();
    error SvgNft__TokenNotFound(uint256 tokenId);

    event NftMinted(
        uint256 indexed tokenId,
        address indexed owner,
        int256 indexed threshold
    );

    constructor(
        address priceFeedAddress,
        string memory tokenName,
        string memory tokenSymbol,
        string memory sakaSvg,
        string memory mltSvg,
        uint256 mintFee
    ) ERC721(tokenName, tokenSymbol) {
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
        s_tokenCounter = 0;
        i_mintFee = mintFee;
        i_sakaImgUri = svgToImgURI(sakaSvg);
        i_mltImgUri = svgToImgURI(mltSvg);
    }

    function withdraw() public onlyOwner returns (bool _success) {
        address target = payable(msg.sender);
        uint256 balance = address(this).balance;
        (bool success, ) = target.call{value: balance}("");
        _success = success;
    }

    function svgToImgURI(
        string memory svgXml
    ) public pure returns (string memory result) {
        string memory buffer = Base64.encode(
            bytes(string(abi.encodePacked(svgXml)))
        );

        // So here, we are actually just concatenating
        result = string(abi.encodePacked(BASE64_ENCODED_SVG_PREFIX, buffer));
        // result = string.concat(BASE64_ENCODED_SVG_PREFIX, buffer);
    }

    modifier enoughFee() {
        if (msg.value < i_mintFee) {
            revert SvgNft__NotEnoughFee();
        }
        _;
    }

    function mintNft(int256 threshold) public payable enoughFee {
        // Mint NFT
        s_tokenCounter += 1;
        address tokenOwner = msg.sender;
        uint256 tokenId = s_tokenCounter;
        s_tokenThreshold[tokenId] = threshold;
        _safeMint(tokenOwner, tokenId);

        emit NftMinted(tokenId, tokenOwner, threshold);
    }

    function getTokenStockPrice() public view returns (int256 result) {
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        result = price;
    }

    function _baseURI() internal pure override returns (string memory result) {
        result = "data:application/json;base64,";
    }

    // Construct our own tokenURI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory result) {
        require(_exists(tokenId), SvgNft__TokenNotFound(tokenId));

        int256 stockPrice = getTokenStockPrice();
        string memory imgUri;
        if (stockPrice >= s_tokenThreshold[tokenId]) {
            imgUri = i_mltImgUri;
        } else {
            imgUri = i_sakaImgUri;
        }

        // Encode JSON
        bytes memory buffer = bytes(
            abi.encodePacked(
                "{",
                '"name":"',
                name(),
                '",',
                '"description":"An SVG NFT based on chainlink price feeds",',
                '"image":"',
                imgUri,
                '",',
                '"attributes":',
                "[",
                '{"trait_type": "stockPrice","value":',
                Strings.toString(uint256(stockPrice)),
                "}",
                "]",
                "}"
            )
        );
        // Add json prefix: data:application/json;base64

        result = string.concat(_baseURI(), Base64.encode(buffer));
    }

    function getPriceFeedAddress() public view returns (address result) {
        result = address(i_priceFeed);
    }

    function getTokenCounter() public view returns (uint256 result) {
        result = s_tokenCounter;
    }

    function getMintFee() public view returns (uint256 result) {
        result = i_mintFee;
    }

    function getTokenThreshold(
        uint256 tokenId
    ) public view returns (int256 result) {
        result = s_tokenThreshold[tokenId];
    }
}
