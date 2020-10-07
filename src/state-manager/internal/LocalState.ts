import { EventEmitter } from "events";

import { CIRCUIT_BREAKER_STATES, State } from "../../states/State";
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

    this.stateTransitionEventListener.on(
      "TRANSITION_STATE",
      this.stateTransitionEventHandler.bind(this)
    );
    this.currentState = this.closedState;
    this.currentState.init();
  }

  private stateTransitionEventHandler(state: CIRCUIT_BREAKER_STATES) {
    switch (state) {
      case CIRCUIT_BREAKER_STATES.CLOSED:
        return this.setState(this.closedState);
      case CIRCUIT_BREAKER_STATES.OPEN:
        return this.setState(this.openState);
      case CIRCUIT_BREAKER_STATES.HALF_OPEN:
        return this.setState(this.halfOpenState);
    }
  }

  setState(newState: State) {
    this.currentState = newState;
    this.currentState.init();
  }

  async getState() {
    return Promise.resolve(this.currentState as State);
  }
}
