import { EventEmitter } from "events";
import { addMilliseconds, getUnixTime } from "date-fns";

import { State } from "../../states/State";
import { ClosedState } from "../../states/Closed";
import { HalfOpenState } from "../../states/HalfOpen";
import { OpenState } from "../../states/Open";
import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../../metrics/CircuitBreakerMetrics";
import { CircuitBreakerStateManager } from "../CircuitBreakerStateManager";
import { RedisClient } from "./RedisClient";
import { IDistributedNodeState } from "./DistributedNodeState";
import { DistributedStateArbiter } from "./DistributedStateArbiter";
import { Time } from "../../metrics/Time";

export class DistributedState implements CircuitBreakerStateManager {
  private localState: State;
  private closedState: ClosedState;
  private openState: OpenState;
  private halfOpenState: HalfOpenState;

  private distributedBroken = false;
  private stateTransitionEventListener = new EventEmitter();
  private redisClient: RedisClient;
  private config: CircuitBreakerConfig;

  private distributedStateArbiter: DistributedStateArbiter;

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
    this.distributedStateArbiter = new DistributedStateArbiter(config);

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
    const currentDate = Time.getCurrentTime();
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

  async setState(newState: State) {
    this.setLocalState(newState);
    await this.setRemoteState(newState);
  }

  async getState() {
    const nodeStates = await this.redisClient.getDistributedNodeStates(
      this.config.distributedCircuitKey
    );

    if (!nodeStates) {
      await this.setRemoteState(this.localState);
      return Promise.resolve(this.localState as State);
    }

    const shouldDistributedBreak = this.distributedStateArbiter.shouldDistributedBreak(
      nodeStates
    );

    if (!shouldDistributedBreak || this.distributedBroken) {
      return Promise.resolve(this.localState as State);
    }

    this.distributedBroken = true;

    // Do we need to check remote state or is local state enough?
    if (this.localState.state === this.closedState.state)
      await this.setState(this.openState);

    return Promise.resolve(this.localState as State);
  }
}
