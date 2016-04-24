import jasmineHttpServerSpy from "jasmine-http-server-spy"
import "isomorphic-fetch"

beforeAll(function(done) {
  this.endpoint = "http://localhost:8088/janus"
  this.httpSpy = jasmineHttpServerSpy.createSpyObj("mockServer", [
    {
      method: "post",
      url: "/janus",
      handlerName: "postJanus"
    },
    {
      method: "get",
      url: "/janus/0",
      handlerName: "getSession"
    },
    {
      method: "post",
      url: "/janus/0",
      handlerName: "postSession"
    },
    {
      method: "post",
      url: "/janus/0/0",
      handlerName: "postPlugin"
    }
  ])
  this.sessionId = 0
  this.httpSpy.postJanus.and.returnValue({
    body: JSON.stringify({
      data: {
        id: this.sessionId
      }
    })
  })
  this.httpSpy.postSession.and.returnValue({
    body: JSON.stringify({
      data: {
        id: this.sessionId
      }
    })
  })
  this.httpSpy.postPlugin.and.returnValue({
    body: JSON.stringify({
      data: {
        id: this.sessionId
      }
    })
  })
  return this.httpSpy.server.start(8088, done)
})

afterAll(function(done) {
  this.httpSpy.server.stop(done)
})
