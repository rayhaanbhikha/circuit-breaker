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

  get distributedCircuitKey() {
    return this.config.distributedState.distributedCircuitKey;
  }
  get nodeId() {
    return this.config.distributedState.nodeId;
  }

  setEventListeners() {
    this.stateTransitionEventListener.on(
      "TRANSITION_STATE",
      async (state: string) => {
        // TODO: error handling.
        switch (state) {
          case this.closedState.state:
            return this.setState(this.closedState);
          case this.openState.state:
            this.distributedBroken = false;
            return this.setState(this.openState);
          case this.halfOpenState.state:
            return this.setState(this.halfOpenState);
        }
      }
    );
  }

  async setState(newState: State) {
    this.setLocalState(newState);
    await this.setRemoteState(newState);
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
      this.distributedCircuitKey,
      this.nodeId,
      nodeState
    );
  }

  async getState() {
    const nodeStates = await this.redisClient.getDistributedNodeStates(
      this.distributedCircuitKey
    );

    const currentNodeState = nodeStates[this.nodeId];

    if (!nodeStates || !currentNodeState) {
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

    if (this.localState.state === this.closedState.state)
      await this.setState(this.openState);

    // if out of sync treat local state as source of truth.
    if (currentNodeState.localState !== this.localState.state)
      await this.setState(this.localState);

    return Promise.resolve(this.localState as State);
  }
}
