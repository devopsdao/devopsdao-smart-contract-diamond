// SPDX-License-Identifier: MIT
//LibTasks.sol
// import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/StringAddressUtils.sol';

pragma solidity ^0.8.17;

library StringToAddress {
    function toAddress(string memory _a) internal pure returns (address) {
        bytes memory tmp = bytes(_a);
        if (tmp.length != 42) return address(0);
        uint160 iaddr = 0;
        uint8 b;
        for (uint256 i = 2; i < 42; i++) {
            b = uint8(tmp[i]);
            if ((b >= 97) && (b <= 102)) b -= 87;
            else if ((b >= 65) && (b <= 70)) b -= 55;
            else if ((b >= 48) && (b <= 57)) b -= 48;
            else return address(0);
            iaddr |= uint160(uint256(b) << ((41 - i) << 2));
        }
        return address(iaddr);
    }
}

library AddressToString {
    function toString(address a) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(a);
        bytes memory characters = '0123456789abcdef';
        bytes memory byteString = new bytes(2 + data.length * 2);

        byteString[0] = '0';
        byteString[1] = 'x';

        for (uint256 i; i < data.length; ++i) {
            byteString[2 + i * 2] = characters[uint256(uint8(data[i] >> 4))];
            byteString[3 + i * 2] = characters[uint256(uint8(data[i] & 0x0f))];
        }
        return string(byteString);
    }
}


// import "../interfaces/ITaskContract.sol";
using AddressToString for address;
using StringToAddress for string;
  
  library LibUtils {
    bool public constant contractLibUtils = true;

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