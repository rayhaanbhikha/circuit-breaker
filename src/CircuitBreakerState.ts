import { State } from "./cb_state/states/State";

export interface CircuitBreakerState {
  getState: () => Promise<State>;
  setCurrentState: (state: State) => Promise<void>;

  transitionToOpenState: () => Promise<void>;
  transitionToClosedState: () => Promise<void>;
  transitionToHalfOpenState: () => Promise<void>;
}
