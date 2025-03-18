// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CallAnything {
    address public s_address;
    uint256 public s_amount;

    constructor() {
        
    }

    /*
    To call function: encode these to binary
        1. Function name
        2. Params
    To encode, need:
        1. Function selector: first 4 bytes of the function signature(got from encoding the function signature)
            e.g: x0a9059cbb
        2. Function signature: String that defines function name & function params
            e.g: "transfer(address,uint256)"
    */
    function transfer(address _to, uint256 amount) public {
        s_address = _to;
        s_amount = amount;
    }

    function getSelector0() public pure returns (bytes4 selector) {
        selector = bytes4(keccak256(bytes("transfer(address,uint256)")));
    }

    function getDataToCallTransfer(address _address, uint256 _amount) public pure returns (bytes memory result){
        /*
        Can use `abi.encodeWithSelector`
        */
        result = abi.encodeWithSelector(getSelector0(), _address, _amount);
    }

    // This is low-level interacting, if we can get interface, then this should be avoided to avoid unwanted results
    function callTransferWithBinary(address _address, uint256 _amount) public returns(bytes4, bool) {
        (bool success, bytes memory returnData) = address(this).call( // `address(this) is the target contract address`
            // getDataToCallTransfer(_address, amount)
            abi.encodeWithSelector(getSelector0(), _address, _amount) // Raw way
            // abi.encodeWithSignature("transfer(address,uint256)", _address, _amount); // With signature
        );
        return (bytes4(returnData), success);
    }
}