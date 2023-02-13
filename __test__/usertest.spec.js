
const request = require("supertest");
 const { server} = require("../index.js")
//import {app} from '../app.js'

  test("It should response the GET method", async () => {
    const response = await request("http://localhost:8080").get("/healthz")
    expect (response.statusCode).toBe(200);
    server.close();
  });





