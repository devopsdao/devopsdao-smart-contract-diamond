// const { ethers } = require("ethers");

async function bridgeBlast(){

    const accounts = await ethers.getSigners();

    const INFURA_KEY = "8fc30a844b8e42e794f1410dd02bc19e";
    const PRIVATE_KEY = '';

    const BlastBridgeAddress = "0xc644cc19d2A9388b71dd1dEde07cFFC73237Dca8";

    // Providers for Sepolia and Blast networks
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_KEY}`);
    const blastProvider = new ethers.providers.JsonRpcProvider("https://sepolia.blast.io");

    // Wallet setup
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const sepoliaWallet = wallet.connect(sepoliaProvider);
    const blastWallet = wallet.connect(blastProvider);

    // Transaction to send 0.1 Sepolia ETH
    const tx = {
        to: BlastBridgeAddress,
        value: ethers.utils.parseEther("2.45")
    };

    const transaction = await sepoliaWallet.sendTransaction(tx);
    await transaction.wait();

    // Confirm the bridged balance on Blast
    const balance = await blastProvider.getBalance(wallet.address);
    console.log(`Balance on Blast: ${ethers.utils.formatEther(balance)} ETH`);

}

exports.bridgeBlast = bridgeBlast;