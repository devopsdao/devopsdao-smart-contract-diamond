// SPDX-License-Identifier: MIT
//LibTasks.sol
import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/StringAddressUtils.sol';

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";
using AddressToString for address;
using StringToAddress for string;
  
  library LibUtils {

    function addressToString(address address_) external pure returns (string memory) {
        return address_.toString();
    }

    function uint2str(
        uint256 _i
      )
        public
        pure
        returns (string memory str)
      {
        if (_i == 0)
        {
          return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0)
        {
          length++;
          j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0)
        {
          bstr[--k] = bytes1(uint8(48 + j % 10));
          j /= 10;
        }
        str = string(bstr);
      }
  
  }