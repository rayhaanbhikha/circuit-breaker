export interface ICircuitBreakerConfig {
  // distributed cb state config
  downstreamServiceKey: string;
  nodeId: string;

  /**
   * Configures the failure rate threshold in percentage. When the failure rate is equal or greater than the threshold the CircuitBreaker transitions to open and starts short-circuiting calls.
   * @example 50
   */
  failureRateThreshold: number;
  // TODO: slowCallRateThreshold
  // TODO: slowCallDurationThreshold

  /**
   * Configures the number of permitted calls when the CircuitBreaker is half open.
   * @example 10
   */
  permittedNumberOfCallsInHalfOpenState: number;
  // TODO: maxWaitDurationInHalfOpenState

  /**
   * Configures the size of the sliding window which is used to record the outcome of calls when the CircuitBreaker is closed.
   * @example 100
   */
  slidingWindowSize: number;
  /**
   * Configures the minimum number of calls which are required (per sliding window period) before the CircuitBreaker can calculate the error rate or slow call rate. For example, if minimumNumberOfCalls is 10, then at least 10 calls must be recorded, before the failure rate can be calculated. If only 9 calls have been recorded the CircuitBreaker will not transition to open even if all 9 calls have failed.
   * @example "10"
   */
  minimumNumberOfCalls?: number;
  /**
   * The time in milliseconds that the CircuitBreaker should wait before transitioning from open to half-open.
   * @example 60000
   */
  waitDurationInOpenState: number;

  /**
   * The fallback function to invoke if the circuit breaker is open or if an error occurs.
   */
  fallback?: (err: Error) => any;
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
