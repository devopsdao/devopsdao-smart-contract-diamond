// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0;

import "@layerzerolabs/solidity-examples/contracts/token/onft/IONFT1155Core.sol";
import "./IERC1155.sol";

/**
 * @dev Interface of the ONFT standard
 */
interface IONFT1155 is IONFT1155Core, IERC1155 {

}
