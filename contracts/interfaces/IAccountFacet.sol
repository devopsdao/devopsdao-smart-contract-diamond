// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
    interface IAccountFacet {
        function addParticipantTask(address _sender, address taskAddress) external;
        function addAuditParticipantTask(address _sender, address taskAddress) external;
        function addAgreedTask(address _sender, address taskAddress) external;
        function addAuditAgreedTask(address _sender, address taskAddress) external;
        function addCompletedTask(address _sender, address taskAddress) external;
        function addAuditCompletedTask(address _sender, address taskAddress) external;
        function addPerformerRating(address _sender, address taskAddress, uint256 rating) external;
        function addCustomerRating(address _sender, address taskAddress, uint256 rating) external;
    }