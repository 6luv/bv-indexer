# BV Indexer

## 1. 프로젝트 소개

BV Indexer는 특정 EVM 지갑 주소를 기준으로 블록체인 데이터를 인덱싱하는 프로젝트입니다.

- 지정한 블록 범위를 기준으로 과거 데이터를 수집 (Backfill)
- 최신 블록을 기준으로 지속적으로 추적하는 실시간 동기화 (Forwardfill)
- ERC-20 `Transfer` 이벤트 인덱싱
- 체크포인트 기반
- 인덱싱 상태 조회 API 제공
- PostgreSQL, Prisma 기반 데이터 저장

---

## 2. 주요 기능

### 2.1 백필 (Backfill)

사용자가 입력한 시작 블록부터 종료 블록까지 순차적으로 처리합니다.

- block range 단위 처리
- batch size 기반 배치 처리
- 체크포인트 이후부터 이어서 처리 가능

### 2.2 실시간 동기화 (Forwardfill)

체크포인트 이후 블록부터 현재 최신 블록까지 따라잡은 뒤, polling 방식으로 신규 블록을 계속 처리합니다.

- 최신 블록 추적
- polling interval 설정 가능
- 중지 요청 가능

### 2.3 ERC-20 `Transfer` 이벤트 인덱싱

로그를 조회하여 ERC-20 `Transfer(address,address,uint256)` 이벤트를 디코딩하고, 특정 지갑 주소와 관련된 이벤트만 필터링하여 저장합니다.

### 2.4 체크포인트 관리

백필과 실시간 동기화 각각의 마지막 처리 블록을 제공합니다.

- `BACKFILL`
- `FORWARDFILL`

### 2.5 상태 조회

현재 인덱서의 실행 상태를 API로 조회할 수 있습니다.

- 현재 모드
- 실행 상태
- 대상 지갑 주소
- 현재 블록
- 마지막 처리 블록
- 최신 블록
- 저장된 트랜잭션 수
- 저장된 Transfer 이벤트 수

---

## 기술 스택

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- viem

---

## 프로젝트 구조

```text
src
├── checkpoint                       # 백필/포워드필 진행 상태 관리
│   ├── application                      # checkpoint 조회/갱신 유스케이스
│   ├── domain                           # checkpoint 도메인 영역
│   │   ├── model                           # Checkpoint 도메인 모델
│   │   └── repository                      # Checkpoint 저장소 인터페이스
│   └── infrastructure                   # checkpoint 외부 구현
│       └── database                        # checkpoint DB 구현체
├── sync                             # 백필/포워드필 실행 흐름 관리
│   ├── application                      # backfill/forwardfill 유스케이스
│   │   └── types                           # backfill-batch 타입
│   ├── entry-point                      # API 요청 진입점
│   └── infrastructure                   # sync 외부 구현
│       └── rpc                             # sync에서 사용하는 RPC 구현
├── transfer-indexing                # Transfer 데이터 인덱싱
│   ├── application                      # 인덱싱 유스케이스/포트/디코더
│   │   ├── decoder                         # Transfer 이벤트 디코딩 추상화
│   │   ├── port                            # RPC 등 외부 의존성 인터페이스
│   │   └── types                           # 인덱싱 결과 타입
│   ├── domain                           # 인덱싱 도메인 영역
│   │   ├── model                           # Log/Transaction/TransferEvent 모델
│   │   └── repository                      # 도메인 저장소 인터페이스
│   └── infrastructure                   # 실제 RPC/DB/Decoder 구현
│       ├── database                        # DB repository 구현체
│       ├── decoder                         # viem 기반 decoder 구현체
│       └── rpc                             # viem 기반 RPC client 구현체
├── shared                           # 공통 모듈
│   ├── database                         # DB client 및 연결 설정
│   ├── types                            # 공통 enum/type
│   └── viem                             # viem client 설정
└── main-server.ts                   # 서버 실행 진입점
```

---

## 모듈 설명

### 1. Checkpoint

인덱싱 작업의 마지막 처리 위치를 관리하는 모듈입니다.

#### 주요 책임

- 백필과 실시간 동기화의 마지막 처리 블록 저장
- 체크포인트 조회
- 체크포인트 갱신
- 재시작 시 다음 처리 시작 블록 결정의 기준 제공

#### 구성

- `application`
  - 체크포인트 조회 및 갱신
- `domain`
  - `Checkpoint` 모델
  - `CheckpointRepository` 인터페이스
- `infrastructure`
  - `PostgreSQL/Prisma` 기반 체크포인트 저장소 구현

### 2. Sync

인덱싱 실행 흐름을 제어하는 모듈입니다.

#### 주요 책임

- 백필 실행
- 실시간 동기화 실행
- 실시간 동기화 중지
- 상태 조회 API 제공
- 인덱싱 서비스 호출
- 체크포인트를 기준으로 처리 범위 계산

#### 구성

- `application`
  - `RunBackfillService`
  - `RunForwardfillService`
  - 실행 흐름 제어
- `infrastructure`
  - `rpc`
    - 최신 블록 조회용 RPC 구현체
  - `api`
    - Express Router
    - 백필 / 실시간 동기화 / 상태 조회 HTTP 엔드포인트

#### 필드

- `type`
- `last_processed_block`
- `updated_at`

### Transfer Indexing

블록체인 데이터에서 실제 인덱싱 대상을 추출하고 저장하는 모듈입니다.

#### 주요 책임

- 블록 또는 블록 범위의 로그 조회
- ERC-20 `Transfer` 이벤트 디코딩
- 대상 지갑과 관련된 이벤트 필터링
- 관련 트랜잭션 저장, `Transfer` 이벤트 저장

#### 구성

- `application`
  - 블록 범위 인덱싱
  - 로그 조회
  - 트랜잭션 조회
  - 이벤트 디코더
- `domain`
  - `Log`
  - `Transaction`
  - `TransferEvent`
  - 각 저장소 인터페이스
- `infrastructure`
  - viem 기반 RPC 클라이언트
  - ERC-20 `Transfer` 디코더 구현제
  - PostgreSQL/Prisma 기반 저장소

#### 필드

- `hash`
- `from_address`
- `to_address`
- `value`
- `block_number`
- `block_hash`
- `block_timestamp`

### Shared

여러 모듈에서 공통으로 사용하는 설정을 제공하는 모듈입니다.

#### 주요 책임

- Prisma Client 관리
- 공통 enum 및 type 관리
- 외부 RPC Client 설정

#### 구성

- `database`
  - Prisma Client
- `types`
  - 공통 enum, type
- `viem`
  - Public Client 및 RPC 설정

#### 필드

- `id`
- `tokoen_address`
- `from_address`
- `to_address`
- `value`
- `block_number`
- `block_timestamp`
- `transaction_hash`
- `log_index`

---

## API

### 1. 상태 조회

GET `/api/indexer/status` : 현재 인덱서 상태를 조회합니다.
Response

```json
{
  "mode": "BACKFILL",
  "status": "RUNNING",
  "targetWalletAddress": "0x...",
  "currentBlock": 10721452,
  "startBlock": 10721400,
  "endBlock": 10721452,
  "latestBlock": 10722000,
  "lastProcessedBlock": 10721450,
  "savedBlockCount": 0,
  "savedTransactionCount": 3,
  "savedLogCount": 0,
  "savedTransferEventCount": 2,
  "pollingIntervalMs": 3000,
  "currentBatchFrom": 10721400,
  "currentBatchTo": 10721452,
  "errorMessage": null,
  "updatedAt": "2026-04-24T00:00:00.000Z"
}
```

### 2. 백필 실행

POST `/api/indexer/backfill` : 백필을 실행합니다.
Request

```json
{
  "targetWalletAddress": "0x...",
  "startBlock": "10721400",
  "endBlock": "10721452",
  "batchSize": "1"
}
```

Response

```json
{
  "ok": true,
  "message": "Backfill completed"
}
```

### 3. 실시간 동기화 실행

POST `/api/indexer/forwardfill` : 실시간 동기화를 실행합니다.
Request

```json
{
  "targetWalletAddress": "0x...",
  "pollingIntervalMs": "3000"
}
```

Response

```json
{
  "ok": true,
  "message": "Forwardfill started"
}
```

### 4. 실시간 동기화 중지

POST `/api/indexer/forwardfill/stop` : 실시간 동기화를 중지합니다.
Response

```json
{
  "ok": true,
  "message": "Forwardfill stop requested"
}
```

---

## 동작 방식

### 1. 백필

1. 시작 블록, 종료 블록, 배치 크기를 입력받습니다.
2. 기존 `BACKFILL` 체크포인트를 조회합니다.
3. 체크포인트 이후 블록부터 처리 범위를 조정합니다.
4. 범위를 `batchSize` 기준으로 나눕니다.
5. 각 배치를 순차 처리합니다.
6. 처리 완료 후 체크포인트를 갱신합니다.

### 2. 실시간 동기화

1. `FORWARDFILL` 체크포인트를 조회합니다.
   1. 체크포인트가 있으면 그 다음 블록부터 시작합니다.
   2. 체크포인트가 없으면 최신 블록을 기준으로 시작합니다.
2. 이후 polling 방식으로 신규 블록을 처리합니다.
3. 각 블록 처리 후 체크포인트를 갱신합니다.

### 3. Transfer 이벤트 인덱싱

1. 블록 범위의 로그를 조회합니다.
2. ERC-20 Transfer 이벤트를 디코딩합니다.
3. 대상 지갑 주소와 관련된 이벤트만 필터링합니다.
4. 관련 트랜잭션을 저장합니다.
5. `Transfer` 이벤트를 저장합니다.

---
