import Redis, { RedisOptions } from "ioredis";
import {
  IDistributedNodeState,
  marshallNodeState,
  unmarshallNodeState,
} from "./DistributedNodeState";

export class RedisClient {
  private redis: Redis.Redis;
  constructor(options?: RedisOptions) {
    // TODO: redis client should be passed through.
    this.redis = new Redis(options);
    this.redis.on("connect", () => {
      console.log("connected to redis");
    });
    this.redis.on("error", (err) => console.log(err));
  }

  updateNodeState(
    downstreamService: string,
    nodeId: string,
    nodeState: IDistributedNodeState
  ) {
    const state = marshallNodeState(nodeState);
    return this.redis.hset(downstreamService, nodeId, state);
  }

  async getNodeStateById(downstreamService: string, nodeId: string) {
    const state = await this.redis.hget(downstreamService, nodeId);
    if (state) {
      return unmarshallNodeState(state);
    } else {
      return null;
    }
  }

  async getDistributedNodeStates(downstreamService: string) {
    const nodeStates = await this.redis.hgetall(downstreamService);
    const unmarshalledNodeStates = {} as Record<string, IDistributedNodeState>;
    for (const [nodeId, nodeState] of Object.entries(nodeStates)) {
      unmarshalledNodeStates[nodeId] = unmarshallNodeState(nodeState);
    }
    return unmarshalledNodeStates;
  }

  quit() {
    this.redis.quit();
  }
}

// (async () => {
//   try {
//     const db = new RedisClient();
//     const downstreamService = "some_service";
//     const nodeId = "node_1";
//     db.updateNodeState(downstreamService, nodeId, {
//       localState: "OPEN",
//       lastContact: Date.now(),
//       lastLocallyBrokenUntil: Date.now() + 5 * 60 * 60 * 1000,
//     });
//     // const res = await db.getNodeStateById(downstreamService, nodeId);
//     // console.log(res);

//     console.log(await db.getDistributedNodeStates(downstreamService));
//     db.quit();
//     return;
//   } catch (error) {
//     console.error(error);
//   }
// })();
