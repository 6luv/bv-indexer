import { Router, Request, Response } from "express";

import { RunBackfillService } from "../application/run-backfill.service";
import { RunForwardfillService } from "../application/run-forwardfill.service";

import { CheckpointService } from "@/checkpoint/application/checkpoint.service";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { TransactionRepository } from "@/transfer-indexing/domain/repository/transaction.repository";
import { TransferEventRepository } from "@/transfer-indexing/domain/repository/transfer-event.repository";
import { BlockRpcClient } from "../infrastructure/rpc/block-rpc-client";

type CreateSyncRouterParams = {
  runBackfillServiceFactory: (
    targetWalletAddress: string,
  ) => RunBackfillService;
  runForwardfillServiceFactory: (
    targetWalletAddress: string,
    pollingIntervalMs: number,
  ) => RunForwardfillService;
  checkpointService: CheckpointService;
  blockRpcClient: BlockRpcClient;
  transactionRepository: TransactionRepository;
  transferEventRepository: TransferEventRepository;
};

export function createSyncRouter({
  runBackfillServiceFactory,
  runForwardfillServiceFactory,
  checkpointService,
  blockRpcClient,
  transactionRepository,
  transferEventRepository,
}: CreateSyncRouterParams): Router {
  const router = Router();

  let isForwardfillRunning = false;
  let activeForwardfillService: RunForwardfillService | null = null;

  let currentMode: "BACKFILL" | "FORWARDFILL" = "BACKFILL";
  let currentTargetWalletAddress: string | null = null;
  let currentStartBlock: number | null = null;
  let currentEndBlock: number | null = null;
  let currentPollingIntervalMs: number | null = null;
  let lastErrorMessage: string | null = null;

  router.get("/status", async (req: Request, res: Response) => {
    try {
      const backfillCheckpoint =
        await checkpointService.getLastProcessedBlockNumber(
          CheckpointType.BACKFILL,
        );

      const forwardfillCheckpoint =
        await checkpointService.getLastProcessedBlockNumber(
          CheckpointType.FORWARDFILL,
        );

      const latestBlock = await blockRpcClient.getLatestBlockNumber();
      const savedTransactionCount = await transactionRepository.count();
      const savedTransferEventCount = await transferEventRepository.count();

      const activeCheckpoint =
        currentMode === "FORWARDFILL"
          ? forwardfillCheckpoint
          : backfillCheckpoint;

      res.json({
        mode: currentMode,
        status:
          currentMode === "FORWARDFILL"
            ? isForwardfillRunning
              ? "RUNNING"
              : "IDLE"
            : "IDLE",
        targetWalletAddress: currentTargetWalletAddress,
        currentBlock: null,
        startBlock: currentStartBlock,
        endBlock: currentEndBlock,
        latestBlock: Number(latestBlock),
        lastProcessedBlock: activeCheckpoint
          ? Number(activeCheckpoint.getLastProcessedBlock())
          : null,
        savedBlockCount: 0,
        savedTransactionCount,
        savedLogCount: 0,
        savedTransferEventCount,
        pollingIntervalMs: currentPollingIntervalMs,
        currentBatchFrom: null,
        currentBatchTo: null,
        errorMessage: lastErrorMessage,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.post("/backfill", async (req: Request, res: Response) => {
    try {
      const { targetWalletAddress, startBlock, endBlock, batchSize } = req.body;

      if (
        !targetWalletAddress ||
        startBlock === undefined ||
        endBlock === undefined ||
        batchSize === undefined
      ) {
        return res.status(400).json({
          ok: false,
          message:
            "targetWalletAddress, startBlock, endBlock, batchSize are required",
        });
      }

      currentMode = "BACKFILL";
      currentTargetWalletAddress = targetWalletAddress;
      currentStartBlock = Number(startBlock);
      currentEndBlock = Number(endBlock);
      currentPollingIntervalMs = null;
      lastErrorMessage = null;

      const runBackfillService = runBackfillServiceFactory(targetWalletAddress);

      await runBackfillService.execute(
        BigInt(startBlock),
        BigInt(endBlock),
        Number(batchSize),
      );

      res.json({
        ok: true,
        message: "Backfill completed",
      });
    } catch (error) {
      lastErrorMessage =
        error instanceof Error ? error.message : "Unknown error";

      res.status(500).json({
        ok: false,
        message: lastErrorMessage,
      });
    }
  });

  router.post("/forwardfill", async (req: Request, res: Response) => {
    try {
      const { targetWalletAddress, pollingIntervalMs } = req.body;

      if (!targetWalletAddress) {
        return res.status(400).json({
          ok: false,
          message: "targetWalletAddress is required",
        });
      }

      if (isForwardfillRunning) {
        return res.status(409).json({
          ok: false,
          message: "Forwardfill is already running",
        });
      }

      currentMode = "FORWARDFILL";
      currentTargetWalletAddress = targetWalletAddress;
      currentStartBlock = null;
      currentEndBlock = null;
      currentPollingIntervalMs = Number(pollingIntervalMs ?? 3000);
      lastErrorMessage = null;

      const runForwardfillService = runForwardfillServiceFactory(
        targetWalletAddress,
        Number(pollingIntervalMs ?? 3000),
      );

      activeForwardfillService = runForwardfillService;
      isForwardfillRunning = true;

      void runForwardfillService
        .execute()
        .catch((error) => {
          lastErrorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Forwardfill failed:", error);
        })
        .finally(() => {
          isForwardfillRunning = false;
          activeForwardfillService = null;
        });

      res.json({
        ok: true,
        message: "Forwardfill started",
      });
    } catch (error) {
      isForwardfillRunning = false;
      activeForwardfillService = null;
      lastErrorMessage =
        error instanceof Error ? error.message : "Unknown error";

      res.status(500).json({
        ok: false,
        message: lastErrorMessage,
      });
    }
  });

  router.post("/forwardfill/stop", async (req: Request, res: Response) => {
    try {
      if (!isForwardfillRunning || !activeForwardfillService) {
        return res.status(409).json({
          ok: false,
          message: "Forwardfill is not running",
        });
      }

      activeForwardfillService.stop();

      res.json({
        ok: true,
        message: "Forwardfill stop requested",
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
