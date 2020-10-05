import { CircuitBreakerConfig } from "./CircuitBreakerConfig";
import { FixedSizeSlidingWindow } from "./FixedSizeSlidingWindow";
import { Time } from "./time";

export class CircuitBreakerMetrics {
  private config: CircuitBreakerConfig;
  private errorsSlidingWindow: FixedSizeSlidingWindow;
  private slowDurationSlidingWindow: FixedSizeSlidingWindow;
  private currentRequestStartTime?: number;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.errorsSlidingWindow = new FixedSizeSlidingWindow(
      this.config.slidingWindowSize
    );
    this.slowDurationSlidingWindow = new FixedSizeSlidingWindow(
      this.config.slidingWindowSize
    );
  }

  resetSlidingWindows(size: number) {
    this.errorsSlidingWindow = new FixedSizeSlidingWindow(size);
    console.log("slidingWindowArranged");
    this.slowDurationSlidingWindow = new FixedSizeSlidingWindow(size);
  }

  recordRequestStartTime() {
    this.currentRequestStartTime = Time.getCurrentTime();
  }

  recordRequestEndTime() {
    if (!this.currentRequestStartTime)
      throw new Error("recordStartTime not invoked");

    const date1 = Time.getCurrentTime();
    const date2 = this.currentRequestStartTime;
    const requestDuration = Time.differenceInMilliseconds(date1, date2);

    if (requestDuration > this.config.slowCallDurationThreshold) {
      this.slowDurationSlidingWindow.add(1);
    } else {
      this.slowDurationSlidingWindow.add(0);
    }
  }

  // TODO: could be emitted as an event.
  recordSuccess() {
    this.errorsSlidingWindow.add(0);
  }

  // TODO: could be emitted as an event
  recordError() {
    this.errorsSlidingWindow.add(1);
  }

  hasExceededErrorThreshold() {
    return (
      this.errorsSlidingWindow.isFull &&
      this.errorsSlidingWindow.currentErrorThreshold >
        this.config.failureRateThreshold
    );
  }

  hasExceededSlowRateThreshold() {
    return (
      this.slowDurationSlidingWindow.isFull &&
      this.slowDurationSlidingWindow.currentErrorThreshold >
        this.config.slowCallRateThreshold
    );
  }
}
