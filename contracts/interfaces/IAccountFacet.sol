    interface IAccountFacet {
        function addParticipantTask(address _sender, address taskAddress) external;
        function addAuditParticipantTask(address _sender, address taskAddress) external;
    }