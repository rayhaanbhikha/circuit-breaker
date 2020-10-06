import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../../CircuitBreakerMetrics";
import { BaseState, State } from "./State";
import { EventEmitter } from "events";
import { HALF_OPEN } from "./HalfOpen";

export const OPEN = "OPEN";

export class OpenState extends BaseState implements State {
  readonly state = OPEN;
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
      this.stel.emit("TRANSITION_STATE", HALF_OPEN);
    }, this.config.waitDurationInOpenState); // TODO: should useBackOff algorithm.
  }

  async exec(cb: Function) {
    return this.config.fallback();
  }
}
