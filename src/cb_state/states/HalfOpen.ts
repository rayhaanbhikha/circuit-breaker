import { CircuitBreakerConfig } from "../../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../../CircuitBreakerMetrics";
import { BaseState, State } from "./State";
import { EventEmitter } from "events";
import { CLOSED_STATE } from "./Closed";
import { OPEN } from "./Open";

export const HALF_OPEN = "HALF_OPEN";

export class HalfOpenState extends BaseState implements State {
  readonly state = HALF_OPEN;
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
        this.stel.emit("TRANSITION_STATE", CLOSED_STATE);

      if (this.isReadyToOpenCB()) this.stel.emit("TRANSITION_STATE", OPEN);

      return res;
    } catch (error) {
      this.metrics.recordError();
      this.metrics.recordRequestEndTime();

      if (this.isReadyToOpenCB()) this.stel.emit("TRANSITION_STATE", OPEN);

      return this.config.fallback(error);
    }
  }
}
