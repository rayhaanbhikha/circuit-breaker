import { IDistributedNodeState } from "./DistributedNodeState";
import { isAfter, isWithinInterval, subMilliseconds } from "date-fns";
import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";
import { Time } from "../../metrics/Time";
import { CIRCUIT_BREAKER_STATES } from "../../states/State";

export class DistributedStateArbiter {
  private config: CircuitBreakerConfig;
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  shouldDistributedBreak(
    distributedNodeStates: Record<string, IDistributedNodeState>
  ): boolean {
    let numOfDistributedNodeStatesBroken = 0;

    const {
      lastContactThreshold,
      openCircuitsThreshold,
    } = this.config.distributedState;

    for (const [_, nodeState] of Object.entries(distributedNodeStates)) {
      const currentTime = Time.getCurrentTime();
      if (
        nodeState.localState === CIRCUIT_BREAKER_STATES.OPEN &&
        isAfter(nodeState.lastLocallyBrokenUntil, currentTime) &&
        // make sure it was last contacted with some time limit.
        isWithinInterval(nodeState.lastContact, {
          start: subMilliseconds(currentTime, lastContactThreshold),
          end: currentTime,
        })
      )
        numOfDistributedNodeStatesBroken++;
    }

    const proportionOfOpenCircuitBreakerStates = Math.floor(
      (numOfDistributedNodeStatesBroken /
        Object.entries(distributedNodeStates).length) *
        100
    );

    return proportionOfOpenCircuitBreakerStates >= openCircuitsThreshold;
  }
}
