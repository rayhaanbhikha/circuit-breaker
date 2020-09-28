import { CircuitBreakerConfig } from "./CircuitBreakerConfig";
import { FixedSizeSlidingWindow } from "./FixedSizeSlidingWindow";

export class CircuitBreakerMetrics {
  private config: CircuitBreakerConfig;
  private slidingWindow: FixedSizeSlidingWindow;
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.slidingWindow = new FixedSizeSlidingWindow(
      this.config.slidingWindowSize
    );
  }

  resetSlidingWindow(size: number) {
    this.slidingWindow = new FixedSizeSlidingWindow(size);
  }

  // TODO: could be emitted as an event.
  recordSuccess() {
    this.slidingWindow.add(0);
  }

  // TODO: could be emitted as an event
  recordError() {
    this.slidingWindow.add(1);
  }

  isSlidingWindowFull() {
    return this.slidingWindow.isFull;
  }

  hasExceededErrorThreshold() {
    return (
      this.slidingWindow.currentErrorThreshold >
      this.config.failureRateThreshold
    );
  }
}
