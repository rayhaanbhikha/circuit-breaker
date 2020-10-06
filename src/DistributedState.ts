import { EventEmitter } from "events";

import { State } from "./states/State";
import { ClosedState } from "./states/Closed";
import { HalfOpenState } from "./states/HalfOpen";
import { OpenState } from "./states/Open";
import { CircuitBreakerConfig } from "./CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "./CircuitBreakerMetrics";
import { CircuitBreakerState } from "./CircuitBreakerState";
import { RedisClient } from "./redis-client";
import { IDistributedNodeState } from "./DistributedNodeState";
import {
  addMilliseconds,
  getUnixTime,
  isAfter,
  isWithinInterval,
  subMilliseconds,
} from "date-fns";

export class DistributedState implements CircuitBreakerState {
  private localState: State;
  private closedState: ClosedState;
  private openState: OpenState;
  private halfOpenState: HalfOpenState;

  private distributedBroken = false;
  private stateTransitionEventListener = new EventEmitter();
  private redisClient: RedisClient;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig, metrics: CircuitBreakerMetrics) {
    this.config = config;
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
        // TODO: error handling.
        switch (state) {
          case this.closedState.state:
            this.setLocalState(this.closedState);
            await this.setRemoteState(this.closedState);
            return;
          case this.openState.state:
            this.distributedBroken = false;
            this.setLocalState(this.openState);
            await this.setRemoteState(this.openState);
            return;
          case this.halfOpenState.state:
            this.setLocalState(this.halfOpenState);
            await this.setRemoteState(this.halfOpenState);
            return;
        }
      }
    );
  }

  setLocalState(newState: State) {
    this.localState = newState;
    this.localState.init();
  }

  async setRemoteState(newState: State) {
    const currentDate = new Date();
    const nodeState: IDistributedNodeState = {
      localState: newState.state,
      lastContact: getUnixTime(currentDate),
      lastLocallyBrokenUntil:
        newState.state === this.openState.state
          ? getUnixTime(
              addMilliseconds(currentDate, this.config.waitDurationInOpenState)
            )
          : 0,
    };
    await this.redisClient.updateNodeState(
      this.config.distributedCircuitKey,
      this.config.nodeId,
      nodeState
    );
  }

  async getState() {
    const nodeStates = await this.redisClient.getDistributedNodeStates(
      this.config.distributedCircuitKey
    );

    if (!nodeStates) {
      await this.setRemoteState(this.localState);
      return Promise.resolve(this.localState as State);
    }

    const shouldBreak = this.shouldDistributeBreak(nodeStates);

    if (!shouldBreak || this.distributedBroken) {
      return Promise.resolve(this.localState as State);
    }

    this.distributedBroken = true;

    // Do we need to check remote state or is local state enough?
    if (this.localState.state === this.closedState.state) {
      this.setLocalState(this.openState);
      await this.setRemoteState(this.openState);
    }

    return Promise.resolve(this.localState as State);
  }

  // if minimum N nodes locally broken.
  shouldDistributeBreak(
    distributedNodeState: Record<string, IDistributedNodeState>
  ) {
    let numOfDistributedNodeStatesBroken = 0;
    for (const [_, nodeState] of Object.entries(distributedNodeState)) {
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
