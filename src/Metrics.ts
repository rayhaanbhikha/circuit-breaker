export interface IMetrics {
  slidingWindowSize?: number;
  minimumNumberOfCalls?: number;
  failureRateThreshold?: number;
}

export class Metrics {
  private failureRateThreshold: number;
  private currentFailureThreshold = 0;
  private slidingWindowSize: number;
  private minimumNumberOfCalls: number;
  private successfullCalls = 0;
  private failedCalls = 0;
  // TODO: add slow calls.
  constructor(options?: IMetrics) {
    this.failureRateThreshold = options?.failureRateThreshold || 50;
    this.slidingWindowSize = options?.slidingWindowSize || 100;
    this.minimumNumberOfCalls =
      options?.slidingWindowSize || Math.floor(0.5 * this.slidingWindowSize);
  }

  recordSuccess() {
    if(this.totalCalls === )
    this.successfullCalls++;
  }

  recordError() {
    this.failedCalls++;
    this.currentFailureThreshold =
      Math.floor(this.failedCalls / this.totalCalls) * 100;
  }

  get totalCalls() {
    return this.failedCalls + this.successfullCalls;
  }
}
