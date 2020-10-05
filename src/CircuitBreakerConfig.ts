import { CallsNotPermittedException } from "./Exceptions/CallsNotPermittedException";

export interface ICircuitBreakerConfig {
  distributedStateConfig?: {
    /**
     * Configures the percentage of open circuits allowed before a distributed circuit break.
     * @example 50
     */
    openCircuitsThreshold: number;
    /**
     * Configures the name of the distributed circuit to represent the downstream service this circuit will protect.
     * @example "some_service"
     */
    distributedCircuitKey: string;
    /**
     * FIXME: might be something done automatically by the library.
     * Configures a unique identifier for the node
     * @example "some-id"
     */
    nodeId: string;
  };

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
   * Configures the time in milliseconds the CircuitBreaker should wait before transitioning from open to half-open.
   * @example 60000
   */
  waitDurationInOpenState: number;

  /**
   * Configures the fallback function to invoke if the circuit breaker is open or if an error occurs.
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

  readonly distributedCircuitKey: string;
  readonly nodeId: string;
  readonly openCircuitsThreshold: number;

  constructor(config: ICircuitBreakerConfig) {
    this.nodeId = config.distributedStateConfig?.nodeId || "";
    this.distributedCircuitKey =
      config.distributedStateConfig?.distributedCircuitKey || "";
    this.openCircuitsThreshold =
      config.distributedStateConfig?.openCircuitsThreshold || 50;
    this.failureRateThreshold = config.failureRateThreshold;
    this.permittedNumberOfCallsInHalfOpenState =
      config.permittedNumberOfCallsInHalfOpenState;
    this.slidingWindowSize = config.slidingWindowSize;
    this.minimumNumberOfCalls =
      config.minimumNumberOfCalls || this.slidingWindowSize;
    this.waitDurationInOpenState = config.waitDurationInOpenState;
  }

  fallback(error?: Error) {
    if (this.fallbackFunc) {
      return this.fallbackFunc(error);
    }

    throw new CallsNotPermittedException(error?.message || "Circuit Open");
  }
}
