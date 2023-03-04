npx hardhat compile
npx hardhat diamondDeploy --network localhost

npx hardhat nftCreate --names auditor --network localhost
npx hardhat nftMint --names auditor --receivers 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 --network localhost

npx hardhat nftCreate --names governor --network localhost
npx hardhat nftMint --names governor --receivers 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 --network localhost

for i in {1..2}; do npx hardhat devCreateTask --type public --title test"$i" --description test"$i" --tags javascript --symbols ETH --amounts 1 --network localhost; done

npx hardhat devTaskParticipate --taskcontract 0xF1823bc4243b40423b8C8c3F6174e687a4C690b8 --message test --network localhost