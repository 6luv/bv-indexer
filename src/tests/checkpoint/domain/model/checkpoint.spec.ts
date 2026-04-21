import { Checkpoint, CheckpointProps } from "@/checkpoint/domain/model/checkpoint";

describe("Checkpoint", () => {
  const BASE_PROPS: CheckpointProps = {
    type: "BACKFILL",
    lastProcessedBlock: 19654321n,
    updatedAt: 1718888888,
  };

  it("유효한 값으로 Checkpoint를 생성할 수 있어야 한다.", () => {
    // Given
    const props = BASE_PROPS;

    // When
    const checkpoint = new Checkpoint(props);

    // Then
    expect(checkpoint.type).toBe(props.type);
    expect(checkpoint.lastProcessedBlock).toBe(props.lastProcessedBlock);
    expect(checkpoint.updatedAt).toBe(props.updatedAt);
  });

  it("type이 FORWARDFILL이어도 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, type: "FORWARDFILL" as const };

    // When
    const checkpoint = new Checkpoint(props);

    // Then
    expect(checkpoint.type).toBe("FORWARDFILL");
  });

  it("lastProcessedBlock이 0n일 때 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, lastProcessedBlock: 0n };

    // When
    const checkpoint = new Checkpoint(props);

    // Then
    expect(checkpoint.lastProcessedBlock).toBe(0n);
  });

  it("updatedAt이 0일 때 정상 생성되어야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, updatedAt: 0 };

    // When
    const checkpoint = new Checkpoint(props);

    // Then
    expect(checkpoint.updatedAt).toBe(0);
  });

  it("type이 BACKFILL 또는 FORWARDFILL이 아니면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, type: "REALTIME" as never };

    // When & Then
    expect(() => new Checkpoint(props)).toThrow(
      "Checkpoint type must be either BACKFILL or FORWARDFILL",
    );
  });

  it("lastProcessedBlock이 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, lastProcessedBlock: -1n };

    // When & Then
    expect(() => new Checkpoint(props)).toThrow(
      "Last processed block must be >= 0",
    );
  });

  it("updatedAt이 0보다 작으면 에러가 발생해야 한다.", () => {
    // Given
    const props = { ...BASE_PROPS, updatedAt: -1 };

    // When & Then
    expect(() => new Checkpoint(props)).toThrow(
      "Updated at timestamp must be >= 0",
    );
  });
});