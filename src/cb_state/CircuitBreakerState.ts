import { State } from "./states/State";

export interface CircuitBreakerState {
  getState: () => Promise<State>;

  transitionToOpenState: () => Promise<void>;
  transitionToClosedState: () => Promise<void>;
  transitionToHalfOpenState: () => Promise<void>;
}
