import "dotenv/config";
import { Injectable } from "@nestjs/common";
import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { Log } from "@/transfer-indexing/domain/model/log";
import { Transaction } from "@/transfer-indexing/domain/model/transaction";
import { BlockchainClient } from "../domain/protocol/blockchain-client.protocol";

const infuraApiKey = process.env.INFURA_API_KEY;

if (!infuraApiKey) {
  throw new Error("INFURA_API_KEY is not defined");
}

const rpcUrl = `https://sepolia.infura.io/v3/${infuraApiKey}`;
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

@Injectable()
export class ViemBlockchainClient implements BlockchainClient {
  private readonly client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl, {
      batch: {
        batchSize: 10,
        wait: 100,
      },
    }),
  });

  async getLatestBlockNumber(): Promise<bigint> {
    return this.client.getBlockNumber();
  }

  async getLogsByBlockNumber(blockNumber: bigint): Promise<Log[]> {
    return this.getLogsInBlockRange(blockNumber, blockNumber);
  }

  async getLogsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Log[]> {
    const logs = await this.client.getLogs({
      fromBlock,
      toBlock,
      event: transferEvent,
      strict: true,
    });

    if (logs.length === 0) return [];

    return logs.flatMap((log) => {
      const blockNumberValue = log.blockNumber;
      const transactionHash = log.transactionHash;
      const blockTimestamp = log.blockTimestamp;
      const logIndex = log.logIndex;

      if (
        blockNumberValue === null ||
        blockNumberValue === undefined ||
        !transactionHash ||
        logIndex === null ||
        logIndex === undefined
      ) {
        return [];
      }

      return [
        Log.create(
          log.address,
          [...log.topics],
          log.data,
          blockNumberValue,
          Number(blockTimestamp),
          transactionHash,
          Number(logIndex),
        ),
      ];
    });
  }

  async getTransactionsByBlockNumber(
    blockNumber: bigint,
  ): Promise<Transaction[]> {
    const block = await this.client.getBlock({
      blockNumber,
      includeTransactions: true,
    });

    const transactions = Array.isArray(block.transactions)
      ? block.transactions
      : [];

    return transactions.map((tx) =>
      Transaction.create(
        tx.hash,
        tx.from,
        tx.to?.toString() ?? "",
        tx.value,
        tx.blockHash,
        block.number,
        Number(block.timestamp),
      ),
    );
  }

  async getTransactionsInBlockRange(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
      const blockTransactions =
        await this.getTransactionsByBlockNumber(blockNumber);

      transactions.push(...blockTransactions);
    }

    return transactions;
  }

  async getTransactionsByHashes(txHashes: string[]): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (const txHash of txHashes) {
      const tx = await this.client.getTransaction({
        hash: txHash as `0x${string}`,
      });

      const block = await this.client.getBlock({
        blockHash: tx.blockHash as `0x${string}`,
      });

      transactions.push(
        Transaction.create(
          tx.hash,
          tx.from,
          tx.to?.toString() ?? "",
          tx.value,
          tx.blockHash,
          block.number,
          Number(block.timestamp),
        ),
      );
    }

    return transactions;
  }
}
