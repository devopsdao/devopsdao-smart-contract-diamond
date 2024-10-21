const { task } = require("hardhat/config");
const fs = require('fs/promises');
const path = require('node:path');

let contractAddresses;

(async() => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if(typeof contractAddressesJson !== 'undefined'){
    contractAddresses = JSON.parse(contractAddressesJson);
  }
  else{
    console.log(`contract addresses file not found at ../abi/addresses.json`)
}
})()


// Helper function to get the QuestboardFacet contract
async function getQuestboardFacet(hre) {
  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
  return await hre.ethers.getContractAt('QuestboardFacet', diamondAddress);
}

task("getParticipantTasksCount", "Get the count of participant tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getParticipantTasksCount(taskArgs.account);
    console.log(`Participant tasks count for ${taskArgs.account}: ${count}`);
  });

task("getAuditParticipantTasksCount", "Get the count of audit participant tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAuditParticipantTasksCount(taskArgs.account);
    console.log(`Audit participant tasks count for ${taskArgs.account}: ${count}`);
  });

task("getAgreedTasksCount", "Get the count of agreed tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAgreedTasksCount(taskArgs.account);
    console.log(`Agreed tasks count for ${taskArgs.account}: ${count}`);
  });

task("getAuditAgreedTasksCount", "Get the count of audit agreed tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAuditAgreedTasksCount(taskArgs.account);
    console.log(`Audit agreed tasks count for ${taskArgs.account}: ${count}`);
  });

task("getCompletedTasksCount", "Get the count of completed tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCompletedTasksCount(taskArgs.account);
    console.log(`Completed tasks count for ${taskArgs.account}: ${count}`);
  });

task("getAuditCompletedTasksCount", "Get the count of audit completed tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAuditCompletedTasksCount(taskArgs.account);
    console.log(`Audit completed tasks count for ${taskArgs.account}: ${count}`);
  });

task("getCustomerRatingsCount", "Get the count of customer ratings for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerRatingsCount(taskArgs.account);
    console.log(`Customer ratings count for ${taskArgs.account}: ${count}`);
  });

task("getPerformerRatingsCount", "Get the count of performer ratings for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getPerformerRatingsCount(taskArgs.account);
    console.log(`Performer ratings count for ${taskArgs.account}: ${count}`);
  });

task("getCustomerAgreedTasksCount", "Get the count of customer agreed tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerAgreedTasksCount(taskArgs.account);
    console.log(`Customer agreed tasks count for ${taskArgs.account}: ${count}`);
  });

task("getPerformerAuditedTasksCount", "Get the count of performer audited tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getPerformerAuditedTasksCount(taskArgs.account);
    console.log(`Performer audited tasks count for ${taskArgs.account}: ${count}`);
  });

task("getCustomerAuditedTasksCount", "Get the count of customer audited tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerAuditedTasksCount(taskArgs.account);
    console.log(`Customer audited tasks count for ${taskArgs.account}: ${count}`);
  });

task("getCustomerCompletedTasksCount", "Get the count of customer completed tasks for an account")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerCompletedTasksCount(taskArgs.account);
    console.log(`Customer completed tasks count for ${taskArgs.account}: ${count}`);
  });

task("getSpentTokenBalance", "Get the spent token balance for an account and token")
  .addParam("account", "The account address")
  .addParam("token", "The token name")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const balance = await questboardFacet.getSpentTokenBalance(taskArgs.account, taskArgs.token);
    console.log(`Spent token balance for ${taskArgs.account} and token ${taskArgs.token}: ${balance}`);
  });

task("getEarnedTokenBalance", "Get the earned token balance for an account and token")
  .addParam("account", "The account address")
  .addParam("token", "The token name")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const balance = await questboardFacet.getEarnedTokenBalance(taskArgs.account, taskArgs.token);
    console.log(`Earned token balance for ${taskArgs.account} and token ${taskArgs.token}: ${balance}`);
  });


task("getCustomerCreatedTasksCountToday", "Get the count of tasks created by a customer today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerCreatedTasksCountToday(taskArgs.account);
    console.log(`Tasks created today by ${taskArgs.account}: ${count}`);
  });

task("getParticipantTasksCountToday", "Get the count of participant tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getParticipantTasksCountToday(taskArgs.account);
    console.log(`Participant tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getAuditParticipantTasksCountToday", "Get the count of audit participant tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAuditParticipantTasksCountToday(taskArgs.account);
    console.log(`Audit participant tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getAgreedTasksCountToday", "Get the count of agreed tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAgreedTasksCountToday(taskArgs.account);
    console.log(`Agreed tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getAuditAgreedTasksCountToday", "Get the count of audit agreed tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAuditAgreedTasksCountToday(taskArgs.account);
    console.log(`Audit agreed tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getCompletedTasksCountToday", "Get the count of completed tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCompletedTasksCountToday(taskArgs.account);
    console.log(`Completed tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getAuditCompletedTasksCountToday", "Get the count of audit completed tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getAuditCompletedTasksCountToday(taskArgs.account);
    console.log(`Audit completed tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getCustomerRatingsCountToday", "Get the count of customer ratings for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerRatingsCountToday(taskArgs.account);
    console.log(`Customer ratings count for ${taskArgs.account} today: ${count}`);
  });

task("getPerformerRatingsCountToday", "Get the count of performer ratings for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getPerformerRatingsCountToday(taskArgs.account);
    console.log(`Performer ratings count for ${taskArgs.account} today: ${count}`);
  });

task("getCustomerAgreedTasksCountToday", "Get the count of customer agreed tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerAgreedTasksCountToday(taskArgs.account);
    console.log(`Customer agreed tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getPerformerAuditedTasksCountToday", "Get the count of performer audited tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getPerformerAuditedTasksCountToday(taskArgs.account);
    console.log(`Performer audited tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getCustomerAuditedTasksCountToday", "Get the count of customer audited tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerAuditedTasksCountToday(taskArgs.account);
    console.log(`Customer audited tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getCustomerCompletedTasksCountToday", "Get the count of customer completed tasks for an account today")
  .addParam("account", "The account address")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const count = await questboardFacet.getCustomerCompletedTasksCountToday(taskArgs.account);
    console.log(`Customer completed tasks count for ${taskArgs.account} today: ${count}`);
  });

task("getSpentTokenBalanceToday", "Get the spent token balance for an account and token today")
  .addParam("account", "The account address")
  .addParam("token", "The token name")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const balance = await questboardFacet.getSpentTokenBalanceToday(taskArgs.account, taskArgs.token);
    console.log(`Spent token balance for ${taskArgs.account} and token ${taskArgs.token} today: ${balance}`);
  });

task("getEarnedTokenBalanceToday", "Get the earned token balance for an account and token today")
  .addParam("account", "The account address")
  .addParam("token", "The token name")
  .setAction(async (taskArgs, hre) => {
    const questboardFacet = await getQuestboardFacet(hre);
    const balance = await questboardFacet.getEarnedTokenBalanceToday(taskArgs.account, taskArgs.token);
    console.log(`Earned token balance for ${taskArgs.account} and token ${taskArgs.token} today: ${balance}`);
  });