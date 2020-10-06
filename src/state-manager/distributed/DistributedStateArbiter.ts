import { IDistributedNodeState } from "./DistributedNodeState";
import { isAfter, isWithinInterval, subMilliseconds } from "date-fns";
import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";

export class DistributedStateArbiter {
  private config: CircuitBreakerConfig;
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  shouldDistributedBreak(
    distributedNodeStates: Record<string, IDistributedNodeState>
  ): boolean {
    let numOfDistributedNodeStatesBroken = 0;
    for (const [_, nodeState] of Object.entries(distributedNodeStates)) {
      const date = Date.now();
      if (
        // TODO: note all these checks should be configurable.
        nodeState.localState === "OPEN" && // state is open
        isAfter(nodeState.lastLocallyBrokenUntil, new Date()) && // state is currently still open
        isWithinInterval(nodeState.lastContact, {
          start: subMilliseconds(date, 1 * 60 * 1000),
          end: date,
        })
      )
        numOfDistributedNodeStatesBroken++;
    }

    // however many nodes.
    // TODO: use percentage value here.
    return numOfDistributedNodeStatesBroken >= 3;
  }
}
