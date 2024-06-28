const fs = require("fs");
const path = require("node:path");

console.log(`current chain id: ${hre.network.config.chainId}`);


let deployedDiamonds;

try{
  const existingDeployedContracts =  fs.readFileSync(path.join(__dirname, `../abi/deployed-contracts.json`));
  deployedContracts = JSON.parse(existingDeployedContracts);
}
catch{
  console.log(`existing ../abi/deployed-contracts.json not found, will create new`);
  deployedContracts = {
    deployArgs: {},
  };
}

console.log(deployedContracts);

module.exports = 
deployedContracts.deployArgs[hre.network.config.chainId].deployArgs
