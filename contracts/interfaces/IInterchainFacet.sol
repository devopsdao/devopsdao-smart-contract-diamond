import "../libraries/LibInterchain.sol";
    
    interface IInterchainFacet {
        function getInterchainConfigs() external returns(ConfigAxelar memory, ConfigHyperlane memory, ConfigLayerzero memory, ConfigWormhole memory);
    }