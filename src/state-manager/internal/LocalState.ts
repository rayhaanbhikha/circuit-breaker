import { EventEmitter } from "events";

import { State } from "../../states/State";
import { ClosedState } from "../../states/Closed";
import { HalfOpenState } from "../../states/HalfOpen";
import { OpenState } from "../../states/Open";
import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../../metrics/CircuitBreakerMetrics";
import { CircuitBreakerStateManager } from "../CircuitBreakerStateManager";

export class LocalState implements CircuitBreakerStateManager {
  private currentState: State;
  private closedState: ClosedState;
  private openState: OpenState;
  private halfOpenState: HalfOpenState;

  private stateTransitionEventListener = new EventEmitter();

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

    this.setEventListeners();
    this.currentState = this.closedState;
    this.currentState.init();
  }

  setEventListeners() {
    this.stateTransitionEventListener.on(
      "TRANSITION_STATE",
      (state: string) => {
        switch (state) {
          case this.closedState.state:
            return this.setCurrentState(this.closedState);
          case this.openState.state:
            return this.setCurrentState(this.openState);
          case this.halfOpenState.state:
            return this.setCurrentState(this.halfOpenState);
        }
      }
    );
  }

  setCurrentState(newState: State) {
    this.currentState = newState;
    this.currentState.init();
  }

  async getState() {
    return Promise.resolve(this.currentState as State);
  }
}