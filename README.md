**QueueCTL Backend**

QueueCTL is a lightweight, command-line–driven job-queue system built in Node.js with SQLite for persistent storage. It supports job scheduling, retry mechanisms, worker execution, and Dead Letter Queue (DLQ) management. The project is designed for local development and controlled execution environments.

Repository: https://github.com/abhishek-yelmamdi/queuectl-backend

**Demo : follow this link**
https://drive.google.com/drive/folders/1xCBKI3A7S_HRCY99pplukBjD03BDJu1b?usp=sharing

**Table of Contents**

1.Overview

2.Architecture

3.Directory Structure

4.Installation

5.Database

6.CLI Usage

7.Worker Execution Model

8.Dead Letter Queue

9.Status and Monitoring

**Example Workflow**

Notes and Assumptions

**1. Overview**

QueueCTL offers a minimal yet functional job-processing system using:

SQLite as a persistent backend.

Node.js services for queue and worker operations.

A fully CLI-based interface for enqueueing, executing, monitoring, and retrying jobs.

The system is intentionally minimal, self-contained, and does not rely on external services or background daemons.

**2. Architecture**

The system is composed of:

Queue Service: Handles job creation, listing, state transitions, and DLQ operations.

Worker Service: Continuously polls pending jobs and executes them with retry and backoff logic.

CLI Interface: Exposes all management operations, including enqueue, worker control, listing, and status.

**Jobs follow a lifecycle:**

pending → processing → completed
or
pending → processing → failed → DLQ

**3. Directory Structure**
queuectl-backend
├─ server.js
├─ app.js
├─ cli.js
├─ package.json
└─ src
   ├─ controllers
   │  └─ queueController.js
   ├─ routes
   │  └─ queueRoutes.js
   ├─ services
   │  ├─ queueService.js
   │  └─ workerService.js
   └─ db
      ├─ index.js
      ├─ init.js
      └─ nodemodel.js


The SQLite database file is stored in:

src/db/queuectl.db

**4. Installation**

Clone the repository:


**git clone https://github.com/abhishek-yelmamdi/queuectl-backend.git
cd queuectl-backend**



Install dependencies:

npm install

**5. Database**

On first use, the system automatically initializes the schema in:

src/db/queuectl.db


**Tables:**

jobs: Stores queued jobs.

dlq: Stores jobs that exceeded retry attempts.

No manual migration is required.


**6. CLI Usage**

All interaction is performed using cli.js.

**6.1 Enqueue Jobs from File**

job.json must contain valid job objects with fields:

id

command

max_retries

Example:

[
  { "id": "job11", "command": "echo Hello", "max_retries": 3 },
  { "id": "job21", "command": "invalidcmd", "max_retries": 2 }
]


Enqueue:

**node cli.js enqueue --file job.json**

6.2 Enqueue Single Job via JSON String
node cli.js enqueue '{"id":"jobX","command":"echo Test","max_retries":1}'

6.3 List Jobs
node cli.js list

6.4 Peek Next Job
node cli.js peek

6.5 Dequeue Manually (optional)
node cli.js dequeue

**7. Worker Execution Model**

Workers are started explicitly via CLI. They poll for pending jobs, mark them as processing, execute shell commands, apply backoff for retries, and route failed jobs to DLQ."/n"

**Start Workers**
node cli.js worker:start --count 2

**Stop Workers**
node cli.js worker:stop


**Worker behavior includes:**

Exponential backoff retry strategy

state transitions

Finalization into DLQ after exceeding max_retries

**8. Dead Letter Queue (DLQ)**
List DLQ Jobs
node cli.js dlq:list

Retry a DLQ Job
node cli.js dlq:retry <jobId>


This resets attempts and reintroduces the job into the main queue.

**9. Status and Monitoring**

Display a summary of queue and worker activity:

node cli.js status


**This reports:**

Total jobs

Pending jobs

Processing jobs

Completed jobs

DLQ count

Active worker count

**10. Example Workflow**

Prepare job definitions:

job.json


**Enqueue jobs:**

node cli.js enqueue --file job.json


**Start workers:**

node cli.js worker:start --count 2


**Review progress:**

node cli.js list
node cli.js dlq:list
node cli.js status


Retry failed DLQ items if required:

node cli.js dlq:retry job21


Stop all workers:

node cli.js worker:stop
