# Solana | On-chain NFT royalty fee updater

This script allows you to update royalty fees of a given list from mint addresses. It only updates the values stored in on-chain data. 

Use it at your own risk and read Options section carefully to avoid unexpected problems.

Tested on Devnet/Mainnet using NFTs that follow Metaplex NFT standards.

Tested OS: Windows 10, macOS 12.4

## Requirements

 - [Node.js](https://nodejs.org/en/)
 - [ts-node](https://www.npmjs.com/package/ts-node)
 - [Metaboss](https://metaboss.rs/quick_start.html)


## Installation

```
npm install
```

## Usage
- Copy and paste the list of NFT/token addresses in **`data/hashlist.json`** in form of [JSON Array](https://www.javatpoint.com/json-array) or directly replace it with your JSON file (with the same name).

### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Example Command (Updates fees to 8.88%)
```
ts-node index.ts -u https://api.devnet.solana.com -k keypair.json -fee 888
```
## Arguments
These are expected arguments and the script can not be executed successfully without them.
### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Keypair
The script expects the keypair file which is the Update Authority of all NFTs of the given list. You can safely place your keypair file inside the folder and simply use `ts-node index.ts -k keypair.json`

```
ts-node index.ts -k <path to keypair>
```

### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fee
The fee you want to update to. Currently, royalties fees are represented as an integer over 10000. So, if you want to update the fee to 11.11% then you need to input 1111

```
ts-node index.ts -fee <new fee>
```

## Options
These are optional arguments that you may need to use depending on your case. **I highly recommend using a custom RPC** as public RPCs are most likely to get rate limited before all NFTs are updated.

### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;RPC URL
This is a heavy task and makes many requests to Solana RPCs. I highly recommend using a **CUSTOM RPC**. The script will use public mainnet RPC by default. 
You can also specify the network by passing Devnet/Local/Testnet RPCs.

```
ts-node index.ts -u <RPC>
```

### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Synchronous
By default, the script will make simultaneous requests to update therefore some transactions may fail. In this case, you can re-execute the script with exactly same command until you get `All NFTs are already updated!` as console output (Let it cooldown at least for few seconds). 

You can use `-s` to make the calls sequentially. It would take much longer than the default way but it is safer in non-immediat cases.

```
ts-node index.ts -s
```
