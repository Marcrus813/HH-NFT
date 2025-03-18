// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Encoding {
    function combineStrings(
        string memory string0,
        string memory string1
    ) public pure returns (string memory result) {
        /**
         * Encoding `string0` and `string1` to its byte form, then `string()` to cast it to string, `abi.encodePacked()`
         * Note to just concat, on ^0.8.12, use `string.concat(string0, string1)`
         */
        return string(abi.encodePacked(string0, string1));
    }

    /*
        Binary code -> instruction set for evm to operate, referring to `https://www.evm.codes/`, say a contract binary is 0x61..., 
        the first action will be `Place 2 byte item on stack`
        So when we were talking about ABI, we were referring to the human readable version of it, now we are dealing with its actual binary form
    */

    function encodeNumber(
        uint256 input
    ) public pure returns (bytes memory encodedResult) {
        encodedResult = abi.encode(input);
    }

    function encodeString(
        string memory input,
        bool packed
    ) public pure returns (bytes memory encodedResult) {
        encodedResult = packed ? abi.encodePacked(input) : abi.encode(input);
        /* Example result: 0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000015600000000000000000000000000000000000000000000000000000000000000
            - There are a lot of 0s, -> `encodePacked`: Types shorter then 32 bytes are concatenated directly, without padding or sign extension
            so this is a compressed approach of `abi.encode`
                - See [https://docs.soliditylang.org/en/latest/abi-spec.html#abi-packed-mode]
            - Packed output: 0x56 -> Save gas
            - Type casting using `bytes()`
                - The result is the same as `abi.encodePacked`, but behind the scenes, it's different
        */
    }

    /*
        Decoding
    */
    function decodeString() public pure returns (string memory output) {
        output = abi.decode(encodeString("V", false), (string)); // Decode it into a string, the arg here is type
    }

    function multiEncode() public pure returns (bytes memory result) {
        result = abi.encode("Hello", "name's V");
    }

    // Multi-decoding
    function multiDecode()
        public
        pure
        returns (string memory part0, string memory part1)
    {
        (part0, part1) = abi.decode(multiEncode(), (string, string));
    }

    function multiEncodePacked() public pure returns (bytes memory result) {
        result = abi.encodePacked("Hello", "name's V");
    }

    function multiDecodePacked()
        public
        pure
        returns (string memory part0, string memory part1)
    {
        // (part0, part1) = abi.decode(multiEncodePacked(), (string, string)); // Won't work! The source is packed
        string memory casted = string(multiEncodePacked());
        part0 = casted;
        part1 = casted;
    }

    /*
        Encoding function calls directly
    */
}
