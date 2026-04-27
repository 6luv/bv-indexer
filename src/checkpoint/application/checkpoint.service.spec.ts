import { CheckpointType } from "@/shared/types/checkpoint-type.enum";
import { Checkpoint } from "../domain/model/checkpoint";
import { CheckpointRepository } from "../domain/repository/checkpoint.repository";
import { CheckpointService } from "./checkpoint.service";

describe("CheckpointService", () => {
  let checkpointRepository: jest.Mocked<CheckpointRepository>;
  let checkpointService: CheckpointService;

  beforeEach(() => {
    checkpointRepository = {
      findByType: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    checkpointService = new CheckpointService(checkpointRepository);
  });

  it("type에 해당하는 체크포인트를 조회할 수 있어야 한다.", async () => {
    // Given
    const checkpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointRepository.findByType.mockResolvedValue(checkpoint);

    // When
    const result = await checkpointService.getLastProcessedBlockNumber(
      CheckpointType.BACKFILL,
    );

    // Then
    expect(result).toBe(checkpoint);
  });

  it("체크포인트가 없으면 null을 반환해야 한다.", async () => {
    // Given
    checkpointRepository.findByType.mockResolvedValue(null);

    // When
    const result = await checkpointService.getLastProcessedBlockNumber(
      CheckpointType.BACKFILL,
    );

    // Then
    expect(result).toBeNull();
  });

  it("기존 체크포인트가 없으면 save를 호출해야 한다.", async () => {
    // Given
    checkpointRepository.findByType.mockResolvedValue(null);

    // When
    await checkpointService.updateLastProcessedBlockNumber(
      100n,
      CheckpointType.BACKFILL,
    );

    // Then
    expect(checkpointRepository.findByType).toHaveBeenCalledWith(
      CheckpointType.BACKFILL,
    );
    expect(checkpointRepository.save).toHaveBeenCalledTimes(1);
    expect(checkpointRepository.update).not.toHaveBeenCalled();

    // save에 전달된 checkpoint 객체 확인
    const savedCheckpoint = checkpointRepository.save.mock.calls[0]?.[0];

    // save에 checkpoint 객체가 전달되었는지 확인
    expect(savedCheckpoint).toBeDefined();
    expect(savedCheckpoint?.getType()).toBe(CheckpointType.BACKFILL);
    expect(savedCheckpoint?.getLastProcessedBlock()).toBe(100n);
    expect(savedCheckpoint?.getUpdatedAt()).toBeGreaterThan(0);
  });

  it("기존 체크포인트가 있으면 update를 호출해야 한다.", async () => {
    // Given
    const existingCheckpoint = Checkpoint.create(
      CheckpointType.BACKFILL,
      100n,
      Math.floor(Date.now() / 1000),
    );

    checkpointRepository.findByType.mockResolvedValue(existingCheckpoint);

    // When
    await checkpointService.updateLastProcessedBlockNumber(
      200n,
      CheckpointType.BACKFILL,
    );

    // Then
    expect(checkpointRepository.findByType).toHaveBeenCalledWith(
      CheckpointType.BACKFILL,
    );
    expect(checkpointRepository.update).toHaveBeenCalledTimes(1);
    expect(checkpointRepository.save).not.toHaveBeenCalled();

    // update에 전달된 checkpoint 객체 확인
    const updatedCheckpoint = checkpointRepository.update.mock.calls[0]?.[0];

    // update에 checkpoint 객체가 전달되었는지 확인
    expect(updatedCheckpoint).toBeDefined();
    expect(updatedCheckpoint?.getType()).toBe(CheckpointType.BACKFILL);
    expect(updatedCheckpoint?.getLastProcessedBlock()).toBe(200n);
    expect(updatedCheckpoint?.getUpdatedAt()).toBeGreaterThan(0);
  });

  it("잘못된 blockNumber가 들어오면 에러가 발생하고 save/update가 호출되지 않아야 한다.", async () => {
    // Given
    checkpointRepository.findByType.mockResolvedValue(null);

    // When & Then
    await expect(
      checkpointService.updateLastProcessedBlockNumber(
        -1n,
        CheckpointType.BACKFILL,
      ),
    ).rejects.toThrow("Last processed block must be >= 0");

    expect(checkpointRepository.save).not.toHaveBeenCalled();
    expect(checkpointRepository.update).not.toHaveBeenCalled();
  });

  it("type에 해당하는 체크포인트를 삭제할 수 있어야 한다.", async () => {
    // Given
    const type = CheckpointType.BACKFILL;

    // When
    await checkpointService.deleteCheckpoint(type);

    // Then
    expect(checkpointRepository.delete).toHaveBeenCalledWith(type);
    expect(checkpointRepository.delete).toHaveBeenCalledTimes(1);
  });
});
