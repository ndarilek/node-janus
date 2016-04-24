import Session, {Handle} from "../lib"

describe("Handle", function() {

  beforeEach(function(done) {
    this.transactionId = "0"
    spyOn(Session, "getTransactionId").and.returnValue(this.transactionId)
    spyOn(Handle.prototype, "emit").and.callThrough()
    this.session = new Session(this.endpoint)
    this.session.on("connected", () => {
      this.session.attach("plugin")
      .then((handle) => {
        this.handle = handle
        this.endpoint = `${this.endpoint}/0/0`
        done()
      })
    })
  })

  describe("message", function() {

    it("sends a correctly-formatted message to the Janus API", function() {
      this.handle.message({body: true}, {jsep: true})
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "message",
          transaction: this.transactionId,
          body: {body: true},
          jsep: {jsep: true}
        })
      })
    })

    it("sends an empty object as the body if the parameter is undefined", function() {
      this.handle.message(null)
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "message",
          transaction: this.transactionId,
          body: {}
        })
      })
    })

  })

  describe("trickle", function() {

    it("handles an array of candidates", function() {
      this.handle.trickle([{candidate: true}])
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "trickle",
          transaction: this.transactionId,
          candidates: [{candidate: true}]
        })
      })
    })

    it("handles a single candidate", function() {
      this.handle.trickle({candidate: true})
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "trickle",
          transaction: this.transactionId,
          candidate: {candidate: true}
        })
      })
    })

    it("sends a completed message if candidates i null", function() {
      this.handle.trickle()
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "trickle",
          transaction: this.transactionId,
          candidate: {completed: true}
        })
      })
    })

  })

  describe("hangup", function() {

    it("sends the correct message to the Janus API", function() {
      this.handle.hangup()
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "hangup",
          transaction: this.transactionId,
        })
      })
    })

  })

  describe("destroy", function() {

    it("emits the destroying and destroyed events", function(done) {
      this.handle.destroy()
      .then(() => {
        expect(Handle.prototype.emit).toHaveBeenCalledWith("destroying")
        expect(Handle.prototype.emit).toHaveBeenCalledWith("destroyed")
        done()
      })
    })

    it("sends the correct message to the Janus API", function() {
      this.handle.destroy()
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          janus: "detach",
          transaction: this.transactionId,
        })
      })
    })

  })

})
