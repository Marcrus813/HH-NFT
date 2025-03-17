// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/**
 * @title RandomIpfsNft
 * @dev Mint -> Use VRF to get random words -> Decide which asset to mint
 *      Users have to pay to mint -> Deployer can withdraw
 * @author
 * @notice
 */
contract RandomIpfsNft is ERC721URIStorage, VRFConsumerBaseV2Plus {
    enum Breed {
        BORDER_COLLIE,
        SHIBA_INU,
        CHIHUAHUA
    }

    // VRF params
    address immutable i_vrfCoordinator;
    uint256 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;
    uint16 private immutable i_requestConfirmations;
    uint32 private immutable i_numWords;

    // Contract params
    string[] internal s_tokenUris;
    uint256 private immutable i_mintFee;

    uint256 private s_tokenCounter;
    mapping(uint256 => address) private s_requestIdToSender;
    uint256 internal constant MAX_TOKEN_CHANCE = 100;

    error RandomIpfsNft__NotEnoughFee();
    error RandomIpfsNft__WithdrawerNotOwner(address sender);

    error RandomIpfsNft__RangeOutOfBounds(uint256 randomNum);

    error RandomIpfsNft__WithdrawFailed();

    event NftRequested(uint256 indexed requestId, address indexed sender);
    event NftFulfilled(
        uint256 indexed requestId,
        address indexed minter,
        uint256 indexed tokenId,
        Breed breed,
        uint256[] rawResults
    );

    event NftMinted(uint256 indexed tokenId, uint256 indexed owner);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        uint32 numWords,
        uint256 mintFee,
        string[3] memory tokenUris
    ) ERC721(tokenName, tokenSymbol) VRFConsumerBaseV2Plus(vrfCoordinator) {
        i_vrfCoordinator = vrfCoordinator;
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        i_requestConfirmations = requestConfirmations;
        i_numWords = numWords;
        i_mintFee = mintFee;
        s_tokenUris = tokenUris;
        s_tokenCounter = 0;
    }

    // Old way, we can also use openzeppelin's `Ownable`

    /* modifier onlyOwnerWithdraw() {
        if (msg.sender != i_contractOwner) {
            revert RandomIpfsNft__WithdrawerNotOwner(msg.sender);
        }
        _;
    } */
    /** Note, VRF2.5 is conflicting with `Ownable`, there's an inheritance link:
     * VRFConsumerBaseV2Plus -> ConfirmedOwner -> ConfirmedOwnerWithProposal -> IOwnable
     * So we could just use `onlyOwner` and it will be fine
     */
    function withdraw() public onlyOwner returns (bool transferResult) {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (success) {
            transferResult = success;
        } else {
            revert RandomIpfsNft__WithdrawFailed();
        }
    }

    modifier enoughMintFee() {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughFee();
        }
        _;
    }

    function requestNft()
        public
        payable
        enoughMintFee
        returns (uint256 requestId)
    {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyHash,
                subId: i_subscriptionId,
                requestConfirmations: i_requestConfirmations,
                callbackGasLimit: i_callbackGasLimit,
                numWords: i_numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        emit NftRequested(requestId, msg.sender);
        s_requestIdToSender[requestId] = msg.sender;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        address tokenOwner = s_requestIdToSender[requestId];
        uint256 requestedResult = randomWords[0];

        uint256 newTokenId = s_tokenCounter;

        uint16 tier = getTier(requestedResult);
        Breed breed = Breed(tier);
        _safeMint(tokenOwner, newTokenId);
        _setTokenURI(newTokenId, s_tokenUris[uint16(breed)]);
        s_tokenCounter += 1;
        emit NftFulfilled(requestId, tokenOwner, newTokenId, breed, randomWords);
    }

    function getChanceArray()
        public
        pure
        returns (uint256[3] memory chanceArray)
    {
        // Tier 0: 5%, Tier 1: 30 - 5 = 25%, Tier 2: 100 - 30 = 70%
        chanceArray = [5, 30, MAX_TOKEN_CHANCE];
    }

    function getTier(uint256 randomNum) public pure returns (uint16 tier) {
        uint256 moddedRandomNum = randomNum % MAX_TOKEN_CHANCE; // Mod by 100, we always get 0-99
        uint256[3] memory chanceArray = getChanceArray();
        uint256 visitedChance = 0;
        bool success = false;
        for (uint16 i = 0; i < chanceArray.length; i++) {
            if (
                (moddedRandomNum >= visitedChance) &&
                (moddedRandomNum < chanceArray[i])
            ) {
                tier = i;
                success = true;
                break;
            }
            visitedChance = chanceArray[i];
        }
        if (!success) {
            revert RandomIpfsNft__RangeOutOfBounds(moddedRandomNum);
        }
    }

    function getVrfCoordinator() public view returns (address result) {
        result = i_vrfCoordinator;
    }

    function getSubscriptionId() public view returns (uint256 result) {
        result = i_subscriptionId;
    }

    function getKeyHash() public view returns (bytes32 result) {
        result = i_keyHash;
    }

    function getCallbackGasLimit() public view returns (uint32 result) {
        result = i_callbackGasLimit;
    }

    function getRequestConfirmations() public view returns (uint16 result) {
        result = i_requestConfirmations;
    }

    function getNumWords() public view returns (uint32 result) {
        result = i_numWords;
    }

    function getTokenCounter() public view returns (uint256 result) {
        result = s_tokenCounter;
    }

    function getMintFee() public view returns (uint256 result) {
        result = i_mintFee;
    }

    function getTokenUris() public view returns (string[] memory result) {
        result = s_tokenUris;
    }

    function getTokenUriOfTier(
        uint16 tier
    ) public view returns (string memory result) {
        result = s_tokenUris[tier];
    }

    function getTokenRequester(
        uint256 requestId
    ) public view returns (address requester) {
        requester = s_requestIdToSender[requestId];
    }
}
