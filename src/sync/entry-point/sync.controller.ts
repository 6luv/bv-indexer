import { Controller, Get, Post, Body, Inject, Logger } from "@nestjs/common";
import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { Erc20TransferEventDecoder } from "@/transfer-indexing/infrastructure/decoder/erc20-transfer-event.decoder";
import { RunBackfillService } from "../application/run-backfill.service";
import { RunForwardfillService } from "../application/run-forwardfill.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { BlockBatchProcessor } from "../application/block-batch-processor.service";
import { TransferEventIndexerService } from "@/transfer-indexing/application/transfer-event-indexer.service";
import { TransferEventService } from "@/transfer-indexing/application/transfer-event.service";
import { TransferEventSaveService } from "@/transfer-indexing/application/transfer-event-save.service";
import {
  BLOCK_READER,
  BlockReader,
} from "../domain/protocol/block-reader.protocol";
import {
  LOG_READER,
  LogReader,
} from "@/transfer-indexing/domain/protocol/log-reader.protocol";
import {
  TRANSACTION_READER,
  TransactionReader,
} from "@/transfer-indexing/domain/protocol/transaction-reader.protocol";
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from "@/transfer-indexing/domain/repository/transaction.repository";
import {
  TRANSFER_EVENT_REPOSITORY,
  TransferEventRepository,
} from "@/transfer-indexing/domain/repository/transfer-event.repository";

@Controller("api/indexer")
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  private isForwardfillRunning = false;
  private isBackfillRunning = false;

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
    @Inject(BLOCK_READER)
    private readonly blockReader: BlockReader,
    @Inject(LOG_READER)
    private readonly logReader: LogReader,
    @Inject(TRANSACTION_READER)
    private readonly transactionReader: TransactionReader,
    @Inject(Erc20TransferEventDecoder)
    private readonly transferEventDecoder: Erc20TransferEventDecoder,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(TRANSFER_EVENT_REPOSITORY)
    private readonly transferEventRepository: TransferEventRepository,
  ) {}

  @Get("status")
  async getStatus() {
    const backfillCheckpoint = await this.checkpointService.getCheckpointByType(
      CheckpointType.BACKFILL,
    );

    const forwardfillCheckpoint =
      await this.checkpointService.getCheckpointByType(
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
          : this.isBackfillRunning
            ? "RUNNING"
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

    if (this.isBackfillRunning) {
      return {
        ok: false,
        message: "Backfill is already running",
      };
    }

    this.currentMode = "BACKFILL";
    this.currentTargetWalletAddress = targetWalletAddress;
    this.currentStartBlock = Number(startBlock);
    this.currentEndBlock = Number(endBlock);
    this.currentPollingIntervalMs = null;
    this.lastErrorMessage = null;
    this.isBackfillRunning = true;

    const runBackfillService =
      this.createRunBackfillService(targetWalletAddress);

    void runBackfillService
      .runBackfill(BigInt(startBlock), BigInt(endBlock), Number(batchSize))
      .catch((error) => {
        this.lastErrorMessage =
          error instanceof Error ? error.message : "Unknown error";

        this.logger.error(
          `Backfill failed: ${this.lastErrorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );

        return;
      })
      .finally(() => {
        this.isBackfillRunning = false;
      });

    return {
      ok: true,
      message: "Backfill started",
    };
  }

  @Post("forwardfill")
  async forwardfill(@Body() body: any) {
    const { targetWalletAddress, pollingIntervalMs } = body;

    if (!targetWalletAddress) {
      return {
        ok: false,
        message: "targetWalletAddress is required",
      };
    }

    if (this.isForwardfillRunning) {
      return {
        ok: false,
        message: "Forwardfill is already running",
      };
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

    void runForwardfillService
      .runForwardfill()
      .catch((error) => {
        this.lastErrorMessage =
          error instanceof Error ? error.message : "Unknown error";

        this.logger.error(
          `Forwardfill failed: ${this.lastErrorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );

        return;
      })
      .finally(() => {
        this.isForwardfillRunning = false;
        this.activeForwardfillService = null;
      });

    return {
      ok: true,
      message: "Forwardfill started",
    };
  }

  @Post("forwardfill/stop")
  async stopForwardfill() {
    if (!this.isForwardfillRunning || !this.activeForwardfillService) {
      return {
        ok: false,
        message: "Forwardfill is not running",
      };
    }

    this.activeForwardfillService.stop();

    return {
      ok: true,
      message: "Forwardfill stop requested",
    };
  }

  private createTransferEventService(
    targetWalletAddress: string,
  ): TransferEventService {
    const transferEventSaveService = new TransferEventSaveService(
      this.transactionRepository,
      this.transferEventRepository,
    );

    const transferEventIndexerService = new TransferEventIndexerService(
      this.transferEventDecoder,
      this.transactionReader,
      transferEventSaveService,
      targetWalletAddress,
    );

    return new TransferEventService(
      this.logReader,
      transferEventIndexerService,
    );
  }

  private createRunBackfillService(
    targetWalletAddress: string,
  ): RunBackfillService {
    const transferEventService =
      this.createTransferEventService(targetWalletAddress);

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
    const transferEventService =
      this.createTransferEventService(targetWalletAddress);

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
