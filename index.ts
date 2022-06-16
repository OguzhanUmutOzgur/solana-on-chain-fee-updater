import { clusterApiUrl, Connection } from "@solana/web3.js";
import fs from "fs";
import { program } from 'commander';
import { calculateApproxFeeCost as calculateApproxFeeCost, deleteData, getOnChainData, readKeypair, updateRoyalties, updateRoyaltiesSync } from './functions';

console.log(`\n\tClearing possible existing data and collecting CLI arguments...`);
deleteData(); //Delete if any previous data exists. No USE

/**Parse CLI options**/
program
    .option('-u, --rpc-url <string>')
    .option('-s, --synchronous')
    .requiredOption('-k, --keypair <path>')
    .requiredOption('-fee, --new-fee <number>', 'Should be equal to (real value * 1000). If 8.88 then input 888');

program.parse();
const options = program.opts();
const isSync = options.synchronous ? true : false;
const rpcURL: string = options.rpcUrl || clusterApiUrl('mainnet-beta');
const newFee: number = parseInt(options.newFee);
const keypairPath: string = options.keypair;

if (newFee < 0 || newFee > 10000) {
    console.log(`\tFee must be an integer between 0 and 10000. Given fee: ${newFee}`);
    process.exit(1);
}

if (!fs.existsSync(keypairPath)) {
    console.log(`\tKeypair not found. Given keypair path: ${keypairPath}`);
    process.exit(1);
}
/***********************/

const updateAuthAddr: string = readKeypair(keypairPath);
const connection = new Connection(rpcURL);
const rawHashlist: string = fs.readFileSync("data/hashlist.json", "utf-8");
let hashlist: Array<string> = JSON.parse(rawHashlist);

let currentCount = 0;
let skippedCount = 0;

//Create the folder if doesn't exist already
if (!fs.existsSync("./data/updatedData")) {
    fs.mkdirSync("./data/updatedData");
}

console.log(`\tFetching On-Chain data and preparing updated data...`);
hashlist.forEach((hash) => {
    (async () => {
        const onChainData = await getOnChainData(hash, connection);

        if (updateAuthAddr !== onChainData.updateAuthority) {
            throw new Error(`Incorrect Update Authority!\n\tExpected: ${onChainData.updateAuthority}\n\tFound: ${updateAuthAddr}`);
        }

        onChainData.data.creators.forEach((creator) => {
            creator.verified = !!creator.verified; //Int to Boolean
        });

        //The Solana/web3js API returns the variable with a different name, need to change the key by keeping same value
        if (onChainData.data["sellerFeeBasisPoints"] != newFee) {
            onChainData.data["seller_fee_basis_points"] = newFee;
            delete onChainData.data["sellerFeeBasisPoints"];

            let toWrite = JSON.stringify(onChainData.data);
            fs.writeFileSync("./data/updatedData/" + hash + ".json", toWrite);

            currentCount++;
        } else {
            //Remove from list if already updated
            hashlist = hashlist.filter(item => item !== hash);
            skippedCount++;
        }

        //to call callback function when required new data created
        if (currentCount == hashlist.length) {
            if (skippedCount > 0) {
                console.log(
                    `\tSkipped ${skippedCount} mints because they were already updated.`
                );
            }
            console.log(`
            \tFound ${hashlist.length} addresses.
            \tExpected fee cost is ${calculateApproxFeeCost(hashlist)} SOL.
            \tFees are subject to change.
            \n\tStarting to update...`);
            isSync ? 
                updateRoyaltiesSync(hashlist, keypairPath, rpcURL) : 
                updateRoyalties(hashlist, keypairPath, rpcURL);
        }
    })();
});