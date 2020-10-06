import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../metrics/CircuitBreakerMetrics";
import { BaseState, CIRCUIT_BREAKER_STATES, State } from "./State";
import { EventEmitter } from "events";

export class OpenState extends BaseState implements State {
  readonly state = CIRCUIT_BREAKER_STATES.OPEN;
  private config: CircuitBreakerConfig;
  private stel: EventEmitter;

  constructor(
    config: CircuitBreakerConfig,
    metrics: CircuitBreakerMetrics,
    stel: EventEmitter
  ) {
    super(metrics);
    this.config = config;
    this.stel = stel;
  }

  init() {
    this.startTimerToHalfOpenState();
  }

  startTimerToHalfOpenState() {
    setTimeout(() => {
      this.stel.emit("TRANSITION_STATE", CIRCUIT_BREAKER_STATES.HALF_OPEN);
    }, this.config.waitDurationInOpenState); // TODO: should useBackOff algorithm.
  }

  async exec(cb: Function) {
    return this.config.fallback();
  }
}
