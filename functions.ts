import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { exec, execSync } from "child_process";
import fs from "fs";

export function calculateApproxFeeCost(hashlist: Array<string>){
    const expectedFeePerNFT = 0.000006;
    return expectedFeePerNFT*hashlist.length;
}

export function deleteData() {
    if (fs.existsSync("./data/updatedData")) {
        fs.rmSync("./data/updatedData", { recursive: true });
    }
}

export function deleteSingleFile(mint: string){
    if (fs.existsSync(`${mint}.json`)) {
        fs.rmSync(`${mint}.json`);
    }
}

export function readKeypair(keypairPath: string) {
    return Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(
            fs.readFileSync(keypairPath, "utf-8")
        ))
    ).publicKey.toBase58();
}

export async function getOnChainData(mint: string, connection: Connection) {
    let mintPubkey = new PublicKey(mint);
    let tokenMetaPubkey = await Metadata.getPDA(mintPubkey);

    const tokenMeta = await Metadata.load(connection, tokenMetaPubkey);

    return tokenMeta.data;
}

export function executeSyncCommand(
    keypairPath: string,
    hash: string,
    filePath: string,
    rpcURL: string
) {
    const metabossCommand = `metaboss update data --keypair ${keypairPath} --account ${hash} --new-data-file ${filePath} -r ${rpcURL}`;

    try {
        execSync(metabossCommand).toString();
        console.log(`\t\tSucceeded: ${hash}`);
        return true;
    }
    catch (error) {
        console.error(`exec error: ${error}`);
        console.log(`\t\tFailed: ${hash}`);
        return false;
    }
}

export function updateRoyaltiesSync(hashlist: Array<string>, keypairPath: string, rpcURL: string) {
    const totalCount = hashlist.length;

    for (const hash of hashlist) {
        let filePath = "./data/updatedData/" + hash + ".json";

        if (!fs.existsSync(filePath)) {
            console.log(`\tCouldn't find data object for hash: ${hash}`);
        } else {
            const res = executeSyncCommand(keypairPath, hash, filePath, rpcURL);
            if (res) {
                hashlist = hashlist.filter(function (listHash) {
                    return listHash !== hash;
                });
            }
        }
    }

    console.log(`\n\n\tTotal: ${totalCount}\n\tSuccess: ${totalCount - hashlist.length}\n\tFailure: ${hashlist.length}`);

    if (hashlist.length > 0) {
        console.log(`\tRetrying failed mint addresses in 2 seconds...`);
        new Promise((resolve) => setTimeout(resolve, 2000)).then(() => { });
        updateRoyaltiesSync(hashlist, keypairPath, rpcURL);
    } else {
        deleteData();
        console.log(`\tCompleted!`);
    }
}

export async function updateRoyalties(hashlist: Array<string>, keypairPath: string, rpcURL: string) {
    const totalCount = hashlist.length;
    let tryCount = 0;

    for (const hash of hashlist) {
        let filePath = "./data/updatedData/" + hash + ".json";

        if (!fs.existsSync(filePath)) {
            // console.log(`Couldn't find data object for hash: ${hash}`);
        } else {
            const metabossCommand = `metaboss update data --keypair ${keypairPath} --account ${hash} --new-data-file ${filePath} -r ${rpcURL}`;

            await exec(metabossCommand, (error, stdout, stderr) => {
                tryCount++;
                if (error) {
                    console.error(`exec error: ${error}`);
                } else if (stderr.length == 0) {
                    hashlist = hashlist.filter(function (listHash) {
                        return listHash !== hash;
                    });
                }
                
                if(tryCount == totalCount){
                    deleteData();
                    console.log(`\n\n\tTotal: ${totalCount}\n\tSuccess: ${totalCount - hashlist.length}\n\tFailure: ${hashlist.length}`);
                    if(hashlist.length != 0){
                        console.log(`\n\tRetrying for ${hashlist.length} failures. Retrying in 5 seconds...`);
                        new Promise((resolve) => setTimeout(resolve, 5000)).then(() => { });
                        updateRoyalties(hashlist, keypairPath, rpcURL);
                    }
                }
            });

            new Promise((resolve) => setTimeout(resolve, 222)).then(() => { });
        }
    }
}