const Arweave = require('arweave');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('node:path');

let contractAddresses;

(async () => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if (typeof contractAddressesJson !== 'undefined') {
    contractAddresses = JSON.parse(contractAddressesJson);
  } else {
    console.log(`contract addresses file not found at ../abi/addresses.json`);
  }
})();

// task("diamondLoupe-facets", "Get all facets and functions")
//   .setAction(async (taskArgs, hre) => {
//     const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
//     const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
//     const facets = await diamondLoupeFacet.facets();
//     console.log(JSON.stringify(facets, null, 2));
//   });


task("diamondLoupe-facets", "Get all facets and functions")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
    const facets = await diamondLoupeFacet.facets();

    // Read the deployed contracts JSON file
    const deployedContractsJson = JSON.parse(await fs.readFile(path.join(__dirname, `../abi/deployed-contracts.json`), 'utf8'));
    const deployedContracts = deployedContractsJson.deployArgs[hre.network.config.chainId];

    // Create a map of facet addresses to contract names
    const facetAddressToName = {};
    for (const contractName in deployedContracts) {
      if (contractName !== 'Diamond') {
        const contractAddress = deployedContracts[contractName].address;
        facetAddressToName[contractAddress.toLowerCase()] = contractName;
      }
    }

    // Display facet information with contract names
    for (const facet of facets) {
      const facetAddress = facet.facetAddress.toLowerCase();
      const contractName = facetAddressToName[facetAddress] || "Unknown";
      console.log(`Facet: ${contractName} (${facetAddress})`);
      console.log("Functions:");
      for (const selector of facet.functionSelectors) {
        console.log(`- ${selector}`);
      }
      console.log("");
    }
  });

task("diamondLoupe-facetAddresses", "Get all facet addresses")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
    const facetAddresses = await diamondLoupeFacet.facetAddresses();
    console.log(facetAddresses);
  });

task("diamondLoupe-facetAddress", "Get facet address for function")
  .addParam("func", "Function selector")  
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
    const facetAddress = await diamondLoupeFacet.facetAddress(taskArgs.func);
    console.log(facetAddress);
  });

task("diamondLoupe-facetFunctionSelectors", "Get all selectors for facet")
  .addParam("facet", "Facet address")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
    const selectors = await diamondLoupeFacet.facetFunctionSelectors(taskArgs.facet);
    console.log(selectors);
  });

task("diamondCut", "Upgrade diamond")
  .addParam("facetCuts", "Stringified facet cuts")
  .addOptionalParam("initAddress", "Address of init contract")
  .addOptionalParam("initData", "Init calldata")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const signers = await ethers.getSigners();
    const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);

    if (taskArgs.facetCuts === undefined) {
      throw new Error("facetCuts argument is required");
    }

    let facetCuts = JSON.parse(taskArgs.facetCuts);
    
    let initAddress = ethers.constants.AddressZero;
    if(taskArgs.initAddress !== undefined) {
      initAddress = taskArgs.initAddress;
    }

    let initData = "0x";
    if(taskArgs.initData !== undefined) {
      initData = taskArgs.initData;
    } 

    console.log("Upgrading diamond with args:");
    console.log({ facetCuts, initAddress, initData });

    let tx = await diamondCutFacet.connect(signers[0]).diamondCut(
      facetCuts,
      initAddress, 
      initData
    );

    console.log("Diamond cut tx: ", tx.hash);
  });


  task("diamondCut-removeAllFunctionsOfFacet", "Remove all functions of a specific facet")
  .addParam("facetAddress", "The address of the facet to remove all functions from")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const signers = await ethers.getSigners();
    const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);
    const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);

    if (taskArgs.facetAddress === undefined) {
      throw new Error("facetAddress argument is required");
    }

    const facetAddress = taskArgs.facetAddress;

    // Get all the function selectors of the facet
    const selectors = await diamondLoupeFacet.facetFunctionSelectors(facetAddress);

    // List the selectors being removed
    console.log("Selectors being removed:");
    for (const selector of selectors) {
      const functionName = await diamondLoupeFacet.fromCode(selector);
      console.log(`- ${selector} (${functionName})`);
    }

    // Create the facet cut to remove all the selectors
    const facetCuts = [
      {
        facetAddress: ethers.constants.AddressZero,
        action: 2, // 2 represents the "Remove" action
        functionSelectors: selectors
      }
    ];

    console.log("Removing all functions of facet:", facetAddress);

    let tx = await diamondCutFacet.connect(signers[0]).diamondCut(
      facetCuts,
      ethers.constants.AddressZero,
      "0x"
    );

    console.log("Diamond cut tx: ", tx.hash);
  });


  
  function getSelectors(abi, contractName) {
    const selectors = {};
    for (const item of abi) {
      if (item.type === 'function') {
        const signature = `${item.name}(${item.inputs.map(input => input.type).join(',')})`;
        const selector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature)).slice(0, 10);
        selectors[signature] = {
          contractName,
          functionName: item.name,
          selector
        };
      }
    }
    return selectors;
  }
  
  function findJsonFiles(dir) {
    let jsonFiles = [];
    const files = fsSync.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fsSync.statSync(filePath);
      if (stat.isDirectory()) {
        jsonFiles = jsonFiles.concat(findJsonFiles(filePath));
      } else if (file.endsWith('.json') && !file.endsWith('.dbg.json')) {
        jsonFiles.push(filePath);
      }
    }
    return jsonFiles;
  }
  
  task("calculateSelectors", "Calculate selectors for each contract ABI")
    .setAction(async (taskArgs, hre) => {
      const artifactsDir = path.join(__dirname, '../artifacts', 'contracts');
      const jsonFiles = findJsonFiles(artifactsDir);
  
      const contracts = {};
  
      for (const file of jsonFiles) {
        const contractName = path.parse(file).name;
        const abi = JSON.parse(fsSync.readFileSync(file, 'utf8')).abi;
        const selectors = getSelectors(abi, contractName);
        contracts[contractName] = selectors;
      }
  
      const output = {};
      for (const contractName in contracts) {
        output[contractName] = {};
        for (const signature in contracts[contractName]) {
          const { functionName, selector } = contracts[contractName][signature];
          output[contractName][functionName] = selector;
        }
      }
  
      console.log(JSON.stringify(output, null, 2));
    });