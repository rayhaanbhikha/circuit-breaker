import { State } from "../states/State";

export interface CircuitBreakerStateManager {
  getState: () => Promise<State>;
}
