import express from "express";
import nock from "nock";
import axios from "axios";

import { CircuitBreaker } from "./CircuitBreaker";

nock("http://localhost:3001")
  .get("/resource?id=1")
  .reply(200, "resource found")
  .persist();

nock("http://localhost:3001")
  .get("/resource?id=2")
  .reply(404, "resource not found")
  .persist();

const cb = new CircuitBreaker({
  failureRateThreshold: 50,
  waitDurationInOpenState: 10_000,
  permittedNumberOfCallsInHalfOpenState: 10,
  slidingWindowSize: 20,
});

const app = express();

app.get("/api", async (req, res) => {
  try {
    const id = req.query["id"];
    console.log("fetching resource ID: ", id);
    const downstreamCallback = () =>
      axios.get(`http://localhost:3001/resource?id=${id}`);
    const { data } = await cb.exec(downstreamCallback);
    console.log(data);
    res.send(data);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

app.get("/cbstate", async (req, res) => {
  const { state } = await cb.currentStateManager.getState();
  res.send(state);
});

app.listen(3000, () => console.log("server started on port 8080"));
