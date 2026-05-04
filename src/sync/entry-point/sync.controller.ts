import { Controller, Get, Post, Body, Inject } from "@nestjs/common";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "@/transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { RunBackfillService } from "../application/run-backfill.service";
import { RunForwardfillService } from "../application/run-forwardfill.service";
import { PostgresTransactionRepository } from "@/transfer-indexing/infrastructure/database/postgres-transaction.repository";
import { PostgresTransferEventRepository } from "@/transfer-indexing/infrastructure/database/postgres-transfer-event.repository";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { ViemBlockReader } from "../infrastructure/rpc/viem-block-reader";
import { ViemLogReader } from "@/transfer-indexing/infrastructure/rpc/viem-log-reader";
import { ViemTransactionReader } from "@/transfer-indexing/infrastructure/rpc/viem-transaction-reader";
import { BlockBatchProcessor } from "../application/block-batch-processor.service";
import { TransferEventIndexerService } from "@/transfer-indexing/application/transfer-event-indexer.service";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";

@Controller("api/indexer")
export class SyncController {
  private isForwardfillRunning = false;
  private activeForwardfillService: RunForwardfillService | null = null;
  private currentMode: "BACKFILL" | "FORWARDFILL" = "BACKFILL";
  private currentTargetWalletAddress: string | null = null;
  private currentStartBlock: number | null = null;
  private currentEndBlock: number | null = null;
  private currentPollingIntervalMs: number | null = null;
  private lastErrorMessage: string | null = null;

  constructor(
    @Inject(CheckpointService)
    private readonly checkpointService: CheckpointService,
    @Inject(ViemBlockReader)
    private readonly blockReader: ViemBlockReader,
    @Inject(ViemLogReader)
    private readonly logRpcClient: ViemLogReader,
    @Inject(ViemTransactionReader)
    private readonly transactionRpcClient: ViemTransactionReader,
    @Inject(Erc20TransferEventDecoder)
    private readonly transferEventDecoder: Erc20TransferEventDecoder,
    @Inject(PostgresTransactionRepository)
    private readonly transactionRepository: PostgresTransactionRepository,
    @Inject(PostgresTransferEventRepository)
    private readonly transferEventRepository: PostgresTransferEventRepository,
  ) {}

  @Get("status")
  async getStatus() {
    const backfillCheckpoint =
      await this.checkpointService.getLastProcessedBlockNumber(
        CheckpointType.BACKFILL,
      );
    const forwardfillCheckpoint =
      await this.checkpointService.getLastProcessedBlockNumber(
        CheckpointType.FORWARDFILL,
      );
    const latestBlock = await this.blockReader.getLatestBlockNumber();
    const savedTransactionCount = await this.transactionRepository.count();
    const savedTransferEventCount = await this.transferEventRepository.count();

    const activeCheckpoint =
      this.currentMode === "FORWARDFILL"
        ? forwardfillCheckpoint
        : backfillCheckpoint;

    return {
      mode: this.currentMode,
      status:
        this.currentMode === "FORWARDFILL"
          ? this.isForwardfillRunning
            ? "RUNNING"
            : "IDLE"
          : "IDLE",
      targetWalletAddress: this.currentTargetWalletAddress,
      currentBlock: null,
      startBlock: this.currentStartBlock,
      endBlock: this.currentEndBlock,
      latestBlock: Number(latestBlock),
      lastProcessedBlock: activeCheckpoint
        ? Number(activeCheckpoint.getLastProcessedBlock())
        : null,
      savedBlockCount: 0,
      savedTransactionCount,
      savedLogCount: 0,
      savedTransferEventCount,
      pollingIntervalMs: this.currentPollingIntervalMs,
      currentBatchFrom: null,
      currentBatchTo: null,
      errorMessage: this.lastErrorMessage,
      updatedAt: new Date().toISOString(),
    };
  }

  @Post("backfill")
  async backfill(@Body() body: any) {
    const { targetWalletAddress, startBlock, endBlock, batchSize } = body;
    if (
      !targetWalletAddress ||
      startBlock === undefined ||
      endBlock === undefined ||
      batchSize === undefined
    ) {
      return {
        ok: false,
        message:
          "targetWalletAddress, startBlock, endBlock, batchSize are required",
      };
    }

    this.currentMode = "BACKFILL";
    this.currentTargetWalletAddress = targetWalletAddress;
    this.currentStartBlock = Number(startBlock);
    this.currentEndBlock = Number(endBlock);
    this.currentPollingIntervalMs = null;
    this.lastErrorMessage = null;

    const runBackfillService =
      this.createRunBackfillService(targetWalletAddress);

    await runBackfillService.runBackfill(
      BigInt(startBlock),
      BigInt(endBlock),
      Number(batchSize),
    );
    return { ok: true, message: "Backfill completed" };
  }

  @Post("forwardfill")
  async forwardfill(@Body() body: any) {
    const { targetWalletAddress, pollingIntervalMs } = body;
    if (!targetWalletAddress) {
      return { ok: false, message: "targetWalletAddress is required" };
    }
    if (this.isForwardfillRunning) {
      return { ok: false, message: "Forwardfill is already running" };
    }

    this.currentMode = "FORWARDFILL";
    this.currentTargetWalletAddress = targetWalletAddress;
    this.currentStartBlock = null;
    this.currentEndBlock = null;
    this.currentPollingIntervalMs = Number(pollingIntervalMs ?? 3000);
    this.lastErrorMessage = null;

    const runForwardfillService = this.createRunForwardfillService(
      targetWalletAddress,
      Number(pollingIntervalMs ?? 3000),
    );

    this.activeForwardfillService = runForwardfillService;
    this.isForwardfillRunning = true;

    runForwardfillService
      .runForwardfill()
      .catch((error) => {
        this.lastErrorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Forwardfill failed:", error);
      })
      .finally(() => {
        this.isForwardfillRunning = false;
        this.activeForwardfillService = null;
      });

    return { ok: true, message: "Forwardfill started" };
  }

  @Post("forwardfill/stop")
  async stopForwardfill() {
    if (!this.isForwardfillRunning || !this.activeForwardfillService) {
      return { ok: false, message: "Forwardfill is not running" };
    }
    this.activeForwardfillService.stop();
    return { ok: true, message: "Forwardfill stop requested" };
  }

  private createRunBackfillService(
    targetWalletAddress: string,
  ): RunBackfillService {
    const transferEventIndexerService = new TransferEventIndexerService(
      this.transferEventDecoder,
      this.transactionRpcClient,
      this.transactionRepository,
      this.transferEventRepository,
      targetWalletAddress,
    );

    const transferEventService = new TransferEventService(
      this.logRpcClient,
      transferEventIndexerService,
    );

    const blockBatchProcessor = new BlockBatchProcessor(
      transferEventService,
      this.checkpointService,
    );

    return new RunBackfillService(this.checkpointService, blockBatchProcessor);
  }

  private createRunForwardfillService(
    targetWalletAddress: string,
    pollingIntervalMs: number,
  ): RunForwardfillService {
    const transferEventIndexerService = new TransferEventIndexerService(
      this.transferEventDecoder,
      this.transactionRpcClient,
      this.transactionRepository,
      this.transferEventRepository,
      targetWalletAddress,
    );

    const transferEventService = new TransferEventService(
      this.logRpcClient,
      transferEventIndexerService,
    );

    const blockBatchProcessor = new BlockBatchProcessor(
      transferEventService,
      this.checkpointService,
    );

    return new RunForwardfillService(
      this.blockReader,
      this.checkpointService,
      pollingIntervalMs,
      blockBatchProcessor,
    );
  }
}
