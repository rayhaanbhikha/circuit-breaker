import { CircuitBreakerConfig } from "../CircuitBreakerConfig";
import { CircuitBreakerMetrics } from "../metrics/CircuitBreakerMetrics";
import { EventEmitter } from "events";

import { BaseState, State } from "./State";
import { OPEN } from "./Open";

export const CLOSED_STATE = "CLOSED";

export class ClosedState extends BaseState implements State {
  readonly state = CLOSED_STATE;
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
    this.metrics.resetSlidingWindows(this.config.slidingWindowSize);
  }

  async exec(callback: Function) {
    try {
      this.metrics.recordRequestStartTime();

      const res = await callback();

      this.metrics.recordSuccess();
      this.metrics.recordRequestEndTime();

      if (this.isReadyToOpenCB()) this.stel.emit("TRANSITION_STATE", OPEN);

      return res;
    } catch (error) {
      // TODO: filter errors with options or status codes?
      this.metrics.recordError();
      this.metrics.recordRequestEndTime();

      if (this.isReadyToOpenCB()) this.stel.emit("TRANSITION_STATE", OPEN);

      return this.config.fallback(error);
    }
  }
}
