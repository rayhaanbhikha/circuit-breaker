import { State } from "./states/State";

export interface CircuitBreakerState {
  getState: () => Promise<State>;
}
