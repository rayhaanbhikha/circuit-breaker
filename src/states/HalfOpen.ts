import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../metrics/CircuitBreakerMetrics";
import { BaseState, CIRCUIT_BREAKER_STATES, State } from "./State";
import { EventEmitter } from "events";

export class HalfOpenState extends BaseState implements State {
  readonly state = CIRCUIT_BREAKER_STATES.HALF_OPEN;
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
    this.metrics.resetSlidingWindows(
      this.config.permittedNumberOfCallsInHalfOpenState
    );
  }

  async exec(callback: Function) {
    try {
      this.metrics.recordRequestStartTime();

      const res = await callback();

      this.metrics.recordSuccess();
      this.metrics.recordRequestEndTime();

      if (this.isReadyToCloseCB())
        this.stel.emit("TRANSITION_STATE", CIRCUIT_BREAKER_STATES.CLOSED);

      if (this.isReadyToOpenCB())
        this.stel.emit("TRANSITION_STATE", CIRCUIT_BREAKER_STATES.OPEN);

      return res;
    } catch (error) {
      this.metrics.recordError();
      this.metrics.recordRequestEndTime();

      if (this.isReadyToOpenCB())
        this.stel.emit("TRANSITION_STATE", CIRCUIT_BREAKER_STATES.OPEN);

      return this.config.fallback(error);
    }
  }
}
