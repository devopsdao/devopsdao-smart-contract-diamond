// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
    interface IAccountFacet {
        function addParticipantTask(address _sender, address taskAddress) external;
        function addAuditParticipantTask(address _sender, address taskAddress) external;
    }