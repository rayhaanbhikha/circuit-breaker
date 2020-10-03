export interface ICircuitBreakerConfig {
  // distributed cb state config
  downstreamServiceKey: string;
  nodeId: string;

  failureRateThreshold: number;
  // slowCallRateThreshold
  // slowCallDurationThreshold

  // half open state config.
  permittedNumberOfCallsInHalfOpenState: number;
  // maxWaitDurationInHalfOpenState

  // open state config.
  slidingWindowSize: number;
  minimumNumberOfCalls?: number;
  waitDurationInOpenState: number;

  fallback?: Function;
}

export class CircuitBreakerConfig {
  private fallbackFunc?: Function;
  readonly failureRateThreshold: number;
  readonly permittedNumberOfCallsInHalfOpenState: number;
  readonly slidingWindowSize: number;
  readonly minimumNumberOfCalls: number;
  readonly waitDurationInOpenState: number;
  readonly downstreamServiceKey: string;
  readonly nodeId: string;
  constructor(config: ICircuitBreakerConfig) {
    this.nodeId = config.nodeId;
    this.downstreamServiceKey = config.downstreamServiceKey;
    this.failureRateThreshold = config.failureRateThreshold;
    this.permittedNumberOfCallsInHalfOpenState =
      config.permittedNumberOfCallsInHalfOpenState;
    this.slidingWindowSize = config.slidingWindowSize;
    this.minimumNumberOfCalls =
      config.minimumNumberOfCalls || this.slidingWindowSize;
    this.waitDurationInOpenState = config.waitDurationInOpenState;
    this.fallbackFunc = config.fallback;
  }

  fallback(error?: Error) {
    if (this.fallbackFunc) {
      return this.fallbackFunc();
    } else if (error) {
      throw error;
    } else {
      // TODO: add custom error for this.
      throw new Error("Fallback not configured");
    }
  }
}
