import assert from "assert"
import simple from "simple-mock"

import Session from "../lib"

describe("Session", function() {

  beforeEach(function() {
    this.result = {data: {id: 0}}
    simple.mock(this.result, "json").resolveWith(this.result)
    this.transactionId = "0"
    simple.mock(Session, "getTransactionId").returnWith(this.transactionId)
    simple.mock(global, "fetch").resolveWith(this.result)
    simple.mock(Session.prototype, "emit")
    simple.mock(Session.prototype, "_poll").resolveWith(true)
  })

  afterEach(function() {
    simple.restore()
  })

  describe("constructor", function() {

    it("throws if no endpoint is specified", function() {
      assert.throws(() => new Session())
    })

    it("throws if `endpoint` is not a string", function() {
      assert.throws(() => new Session(3))
    })

    it("creates a Janus session at the specified endpoint", function() {
      const s = new Session("endpoint")
      assert(fetch.called)
      const call = fetch.calls[0]
      assert.equal(call.args[0], "endpoint")
      assert.deepEqual(call.args[1], {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "create",
          transaction: this.transactionId
        })
      })
    })

    it("should emit `connected` if successful", function(done) {
      const s = new Session("endpoint")
      setTimeout(() => {
        assert(s.emit.called)
        assert.equal(s.emit.calls[0].args[0], "connected")
        done()
      }, 50)
    })

    it("starts polling when created", function(done) {
      const s = new Session("endpoint")
      setTimeout(() => {
        assert(s._poll.called)
        done()
      }, 50)
    })

  })

})
