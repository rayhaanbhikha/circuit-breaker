export interface ICircuitBreakerConfig {
  failureRateThreshold: number;
  // slowCallRateThreshold
  // slowCallDurationThreshold

  // half open state config.
  permittedNumberOfCallsInHalfOpenState: number;
  // maxWaitDurationInHalfOpenState

  // open state config.
  slidingWindowSize: number;
  minimumNumberOfCalls: number;
  waitDurationInOpenState: number;

  fallback: Function;
}

export class CircuitBreakerConfig {
  readonly fallback: Function;
  readonly failureRateThreshold: number;
  readonly permittedNumberOfCallsInHalfOpenState: number;
  readonly slidingWindowSize: number;
  readonly minimumNumberOfCalls: number;
  readonly waitDurationInOpenState: number;
  constructor(config: ICircuitBreakerConfig) {
    this.failureRateThreshold = config.failureRateThreshold;
    this.permittedNumberOfCallsInHalfOpenState =
      config.permittedNumberOfCallsInHalfOpenState;
    this.slidingWindowSize = config.slidingWindowSize;
    this.minimumNumberOfCalls = config.minimumNumberOfCalls;
    this.waitDurationInOpenState = config.waitDurationInOpenState;
    this.fallback = config.fallback;
  }
}
