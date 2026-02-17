# Revive Engine

A Durable Execution Engine Simulator

Revive Engine is an interactive simulation of a durable workflow runtime inspired by systems such as Temporal, Cadence, DBOS, and Azure Durable Functions.

It demonstrates how normal application code (loops, conditionals, parallel tasks) can be made crash-resilient by checkpointing side effects and replaying execution deterministically.

---

## Overview

In traditional programs, a crash wipes all in-memory state and forces the workflow to restart from the beginning.

In a durable execution model:

* Every side effect is wrapped in a `step`
* Step results are persisted
* On restart, previously completed steps are skipped
* The workflow resumes from the exact failure point

This project simulates that behavior using deterministic replay and a persistent state model.

---

## Core Concepts

### Step Primitive

Any side-effecting operation must be wrapped in a `step` call:

```ts
await ctx.step("Create Record", async () => {
  return { id: 101 };
});
```

Execution behavior:

* If the step result exists → return cached result
* If not → execute function → serialize result → persist

This guarantees idempotent execution across crashes.

---

### Memoization & Persistence

Each step is stored in a simulated RDBMS-style table containing:

* `workflow_id`
* `step_key`
* `status`
* `serialized_output`

The step key is composed of:

```
workflow_id + step_id + sequence_number
```

This ensures uniqueness even when steps repeat inside loops or conditional branches.

---

### Logical Sequence Management

To support repeated steps, the engine maintains an internal deterministic sequence counter.

Example:

```ts
for (let i = 0; i < 3; i++) {
  await ctx.step("Send Email", ...)
}
```

Each iteration receives a unique sequence number, allowing correct replay without collisions.

---

### Concurrency

The engine supports parallel execution using a `parallel` helper.

* Sequence IDs remain deterministic
* Step keys are unique
* Duplicate execution is prevented at the persistence layer

This simulates safe concurrent step execution.

---

## Resilience Model

### Crash Recovery

If the process crashes:

* Completed steps remain persisted
* On restart, the workflow replays
* Stored steps are skipped
* Execution continues from the last incomplete step

---

### Zombie Step Handling

A "Zombie Step" occurs when a side effect completes but the process crashes before committing the result.

This simulator mitigates the issue by:

* Writing explicit step state transitions
* Minimizing the window between execution and commit
* Detecting incomplete steps during replay

While not a full distributed transaction engine, it demonstrates practical mitigation strategies used in durable systems.

---

## Example Workflow

Employee Onboarding workflow:

1. Create Employee Record (Sequential)
2. Provision Laptop (Parallel)
3. Grant Access (Parallel)
4. Send Welcome Email (Sequential)

The simulator allows:

* Running the workflow
* Simulating a crash
* Resuming execution
* Resetting state

---

## Technical Stack

* TypeScript
* React
* Tailwind CSS
* Lucide Icons
* In-memory JSON store (simulating RDBMS behavior)

---

# Run and Deploy

This repository contains everything required to run the app locally.

### View in AI Studio

You can preview the original AI Studio version here:

[https://ai.studio/apps/drive/1dAn5PayHarWDTA9ptfRA2aqX9ZBrO2Xr](https://ai.studio/apps/drive/1dAn5PayHarWDTA9ptfRA2aqX9ZBrO2Xr)

---

## Run Locally

### Prerequisites

* Node.js (v18+ recommended)

### Steps

1. Install dependencies:

```
npm install
```

2. Create a `.env.local` file and set:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Start the development server:

```
npm run dev
```

The app will run locally at:

```
http://localhost:5173
```

---

## Purpose of This Project

This project demonstrates understanding of:

* Durable execution patterns
* Deterministic replay
* Idempotent step design
* Concurrency control
* Crash recovery mechanisms
* Workflow orchestration principles

