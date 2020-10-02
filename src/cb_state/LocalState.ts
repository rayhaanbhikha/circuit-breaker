import { EventEmitter } from "events";

import { State } from "./states/State";
import { ClosedState } from "./states/Closed";
import { HalfOpenState } from "./states/HalfOpen";
import { OpenState } from "./states/Open";
import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { CircuitBreakerState } from "./CircuitBreakerState";

export class LocalState implements CircuitBreakerState {
  private currentState?: State;
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
    this.currentState = newState;
    this.currentState.init();
  }

  async getState() {
    if (!this.currentState) {
      await this.setCurrentState(this.closedState);
    }
    return Promise.resolve(this.currentState as State);
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
