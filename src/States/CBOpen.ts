import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerState } from "../CircuitBreakerState";
import { CircuitBreakerMetrics } from "../CircuitBreakerMetrics";
import { State } from "./State";
import { EventEmitter } from "events";

export class OpenState implements State {
  readonly state = "OPEN";
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private stel: EventEmitter;

  constructor(
    config: CircuitBreakerConfig,
    metrics: CircuitBreakerMetrics,
    stel: EventEmitter
  ) {
    this.config = config;
    this.metrics = metrics;
    this.stel = stel;
  }

  init() {
    this.startTimerToHalfOpenState();
  }

  startTimerToHalfOpenState() {
    setTimeout(() => {
      this.stel.emit("TRANSITION_STATE", "HALF_OPEN");
    }, this.config.waitDurationInOpenState);
  }

  async exec(cb: Function) {
    console.log("CB currently open");
    return this.config.fallback();
  }
}
