import Redis, { RedisOptions } from "ioredis";

class RedisClient {
  private redis: Redis.Redis;
  constructor(options?: RedisOptions) {
    // TODO: redis client should be passed through.
    this.redis = new Redis(options);
    this.redis.on("connect", () => {
      console.log("connected to redis");
    });
    this.redis.on("error", (err) => console.log(err));
  }

  setService(downstreamService: string, nodeId: string, value: string) {
    return this.redis.hset(downstreamService, nodeId, value);
  }

  getServiceByNodeId(downstreamService: string, nodeId: string) {
    return this.redis.hget(downstreamService, nodeId);
  }

  quit() {
    this.redis.quit();
  }
}

(async () => {
  try {
    const db = new RedisClient();
    const downstreamService = "some_service";
    const nodeId = "node_1";
    db.setService(downstreamService, nodeId, `OPEN:${new Date()}`);
    const res = await db.getServiceByNodeId(downstreamService, nodeId);
    console.log(res);
    db.quit();
    return;
  } catch (error) {
    console.error(error);
  }
})();
