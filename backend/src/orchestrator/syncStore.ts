export type SyncStatus = 
  | 'PENDING' 
  | 'EXPORTING' 
  | 'IMPORTING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface SyncRun {
  id: string;
  status: SyncStatus;
  databricksRunId?: number;
  logs: string[];
  createdAt: Date;
  completedAt?: Date;
}

class SyncStore {
  private runs: Map<string, SyncRun> = new Map();

  createRun(id: string): SyncRun {
    const run: SyncRun = {
      id,
      status: 'PENDING',
      logs: [`[${new Date().toISOString()}] Run created`],
      createdAt: new Date(),
    };
    this.runs.set(id, run);
    return run;
  }

  getRun(id: string): SyncRun | undefined {
    return this.runs.get(id);
  }

  listRuns(): SyncRun[] {
    // Return newest first
    return Array.from(this.runs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateStatus(id: string, status: SyncStatus, message?: string) {
    const run = this.runs.get(id);
    if (run) {
      run.status = status;
      if (message) {
        this.addLog(id, message);
      }
      if (status === 'COMPLETED' || status === 'FAILED') {
        run.completedAt = new Date();
      }
    }
  }

  setDatabricksRunId(id: string, runId: number) {
    const run = this.runs.get(id);
    if (run) {
      run.databricksRunId = runId;
    }
  }

  addLog(id: string, message: string) {
    const run = this.runs.get(id);
    if (run) {
      run.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }
}

export const syncStore = new SyncStore();
