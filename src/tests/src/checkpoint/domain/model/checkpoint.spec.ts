import { Checkpoint } from "@/checkpoint/domain/model/checkpoint";
import { CheckpointType } from "@/shared/types/checkpoint-type.enum";

describe("Checkpoint", () => {
  const now = Math.floor(Date.now() / 1000);
  const BASE_PROPS = {
    type: CheckpointType.BACKFILL,
    lastProcessedBlock: 100n,
    updatedAt: now,
  };

  it("유효한 값으로 Checkpoint를 생성할 수 있어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS };

    // When
    const checkpoint = Checkpoint.create(
      props.type,
      props.lastProcessedBlock,
      props.updatedAt,
    );

    // Then
    expect(checkpoint.getType()).toBe(BASE_PROPS.type);
    expect(checkpoint.getLastProcessedBlock()).toBe(
      BASE_PROPS.lastProcessedBlock,
    );
    expect(checkpoint.getUpdatedAt()).toBe(BASE_PROPS.updatedAt);
  });

  it("BACKFILL 타입으로 Checkpoint를 생성할 수 있어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, type: CheckpointType.BACKFILL };

    // When
    const checkpoint = Checkpoint.create(
      props.type,
      props.lastProcessedBlock,
      props.updatedAt,
    );

    // Then
    expect(checkpoint.getType()).toBe(CheckpointType.BACKFILL);
  });

  it("FORWARDFILL 타입으로 Checkpoint를 생성할 수 있어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, type: CheckpointType.FORWARDFILL };

    // When
    const checkpoint = Checkpoint.create(
      props.type,
      props.lastProcessedBlock,
      props.updatedAt,
    );

    // Then
    expect(checkpoint.getType()).toBe(CheckpointType.FORWARDFILL);
  });

  it("lastProcessedBlock이 0이어도 생성할 수 있어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, lastProcessedBlock: 0n };

    // When
    const checkpoint = Checkpoint.create(
      props.type,
      props.lastProcessedBlock,
      props.updatedAt,
    );

    // Then
    expect(checkpoint.getLastProcessedBlock()).toBe(0n);
  });

  it("CheckpointType이 BACKFILL, FORWARDFILL이 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, type: "invalid" as CheckpointType };

    // When & Then
    expect(() =>
      Checkpoint.create(props.type, props.lastProcessedBlock, props.updatedAt),
    ).toThrow("Checkpoint type must be either BACKFILL or FORWARDFILL");
  });

  it("lastProcessedBlock이 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, lastProcessedBlock: -1n };

    // When & Then
    expect(() =>
      Checkpoint.create(props.type, props.lastProcessedBlock, props.updatedAt),
    ).toThrow("Last processed block must be >= 0");
  });

  it("updatedAt이 0보다 작면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, updatedAt: -1 };

    // When & Then
    expect(() =>
      Checkpoint.create(props.type, props.lastProcessedBlock, props.updatedAt),
    ).toThrow("Updated at timestamp must be >= 0");
  });
});
