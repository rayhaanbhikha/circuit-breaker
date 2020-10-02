import { EventEmitter } from "events";

import { State } from "./states/State";
import { ClosedState } from "./states/Closed";
import { HalfOpenState } from "./states/HalfOpen";
import { OpenState } from "./states/Open";
import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { CircuitBreakerState } from "./CircuitBreakerState";
import { RedisClient } from "./redis-client";
import { IDistributedNodeState } from "./DistributedNodeState";

export class DistributedState implements CircuitBreakerState {
  private localState: State;
  private closedState: ClosedState;
  private openState: OpenState;
  private halfOpenState: HalfOpenState;

  private stateTransitionEventListener = new EventEmitter();
  private redisClient: RedisClient;

  constructor(config: CircuitBreakerConfig, metrics: CircuitBreakerMetrics) {
    this.closedState = new ClosedState(
      config,
      metrics,
      this.stateTransitionEventListener
    );
    this.openState = new OpenState(
      config,
      metrics,
      this.stateTransitionEventListener
    );
    this.halfOpenState = new HalfOpenState(
      config,
      metrics,
      this.stateTransitionEventListener
    );
    this.redisClient = new RedisClient();

    this.setEventListeners();

    this.localState = this.closedState;
    this.localState.init();
  }

  setEventListeners() {
    this.stateTransitionEventListener.on(
      "TRANSITION_STATE",
      async (state: string) => {
        switch (state) {
          case this.closedState.state:
            await this.transitionToClosedState();
            return;
          case this.openState.state:
            await this.transitionToOpenState();
            return;
          case this.halfOpenState.state:
            await this.transitionToHalfOpenState();
            return;
        }
      }
    );
  }

  async setCurrentState(newState: State) {
    this.localState = newState;
    this.localState.init();

    const nodeState: IDistributedNodeState = {
      localState: this.localState.state,
      lastContact: Date.now(),
      lastLocallyBrokenUntil:
        this.localState.state === this.closedState.state
          ? 5 * 60 * 60 * 1000
          : 0,
    };
    await this.redisClient.updateNodeState(
      "SOME_SERVICE",
      "NODE_ID_1",
      nodeState
    );
  }

  async getState() {
    const nodeStates = await this.redisClient.getDistributedNodeStates(
      "SOME_SERVICE"
    );

    if (!nodeStates) {
      await this.setCurrentState(this.closedState);
    }

    const shouldBreak = shouldDistributeBreak(nodeStates);

    // currentstate is open + localstate is open
    if ((shouldBreak && this.localState.state === "OPEN") || "HALF_OPEN") {
      return Promise.resolve(this.localState as State);
    }

    // currentState is open + localstate is closed
    if (shouldBreak && this.localState.state === "CLOSED") {
      // check why it was broken the last time.
      if(brokenlastTime)
    }

    // quorum logic to decide new localstate.
    return Promise.resolve(this.localState as State);
  }

  async transitionToOpenState() {
    console.log("TRANSITIONED TO ---->>>> OPEN STATE");
    return this.setCurrentState(this.openState);
  }

  async transitionToClosedState() {
    console.log("TRANSITIONED TO ---->>>> CLOSED STATE");
    return this.setCurrentState(this.closedState);
  }

  async transitionToHalfOpenState() {
    console.log("TRANSITIONED TO ---->>>> HALF_OPEN STATE");
    return this.setCurrentState(this.halfOpenState);
  }
}

// if minimum N nodes locally broken.
function shouldDistributeBreak(
  distributedNodeState: Record<string, IDistributedNodeState>
) {
  let numOfDistributedNodeStatesBroken = 0;
  for (const [_, nodeState] of Object.entries(distributedNodeState)) {
    if (
      // TODO: note all these checks should be configurable.
      nodeState.localState === "OPEN" && // state is open
      nodeState.lastLocallyBrokenUntil > Date.now() && // state is currently still open
      nodeState.lastContact < Date.now() - 1 * 60 * 60 * 1000 // state was in contact within 60 mins.
    )
      numOfDistributedNodeStatesBroken++;
  }

  // however many nodes.
  return numOfDistributedNodeStatesBroken >= 3;
}
