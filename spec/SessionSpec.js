import jasmineHttpServerSpy from "jasmine-http-server-spy"

import Session, {Handle} from "../lib"

describe("Session", function() {

  beforeEach(function() {
    this.transactionId = "0"
    spyOn(Session, "getTransactionId").and.returnValue(this.transactionId)
    spyOn(Session.prototype, "emit").and.callThrough()
    spyOn(Handle.prototype, "emit").and.callThrough()
  })

  describe("constructor", function() {

    beforeEach(function() {
      spyOn(Session.prototype, "poll").and.callThrough()
    })

    it("throws if no endpoint is specified", function() {
      expect(() => new Session()).toThrow()
    })

    it("throws if `endpoint` is not a string", function() {
      expect(() => new Session(3)).toThrow()
    })

    it("creates a Janus session at the specified endpoint", function() {
      const s = new Session(this.endpoint)
      expect(fetch).toHaveBeenCalledWith(this.endpoint, {
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

    it("attaches to the specified session ID if one is given", function(done) {
      const s = new Session(this.endpoint, true, 100)
      setTimeout(() => {
        expect(Session.prototype.poll).toHaveBeenCalled()
        expect(fetch).toHaveBeenCalledWith(`${this.endpoint}/100`, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        })
        done()
      }, 100)
    })

    it("should emit `connected` if successful", function(done) {
      const s = new Session(this.endpoint)
      setTimeout(() => {
        expect(Session.prototype.emit).toHaveBeenCalledWith("connected")
        done()
      }, 100)
    })

    it("sets a correct session ID", function(done) {
      const s = new Session(this.endpoint)
      setTimeout(() => {
        expect(s.id).toBe(this.sessionId)
        done()
      }, 100)
    })

    it("starts polling when created", function(done) {
      const s = new Session(this.endpoint)
      setTimeout(() => {
        expect(Session.prototype.poll).toHaveBeenCalled()
        done()
      }, 100)
    })

    it("does not poll when created with start=false", function(done) {
      const s = new Session(this.endpoint, false)
      setTimeout(() => {
        expect(Session.prototype.poll).not.toHaveBeenCalled()
        done()
      }, 100)
    })

  })

  describe("An existing session", function() {

    beforeEach(function(done) {
      this.session = new Session(this.endpoint, false)
      this.session.on("connected", done)
    })

    describe("attach", function() {

      it("throws if no plugin ID is passed", function() {
        expect(() => this.session.attach()).toThrow()
      })

      it("throws if an empty plugin ID is passed", function() {
        expect(() => this.session.attach("")).toThrow()
      })

      it("attaches a plugin to the specified session", function() {
        this.session.attach("plugin")
        expect(fetch).toHaveBeenCalledWith(`${this.endpoint}/0`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            janus: "attach",
            plugin: "plugin",
            transaction: this.transactionId
          })
        })
      })

      it("sets the correct plugin ID", function(done) {
        this.session.attach("plugin")
        .then((handle) => {
          expect(handle.id).toBe(0)
          done()
        })
      })

      it("does not work on a destroyed session", function() {
        this.session.destroy()
        expect(() => this.session.attach("plugin")).toThrow()
      })

    })

    describe("poll", function() {

      it("handles Janus error events", function(done) {
        const reason = "boo"
        this.httpSpy.getSession.and.returnValue({
          body: JSON.stringify({
            janus: "error",
            error: {reason}
          })
        })
        this.session.poll()
        setTimeout(() => {
          expect(Session.prototype.emit).toHaveBeenCalledWith("error", new Error(reason))
          done()
        }, 100)
      })

      it("routes events to plugin handles", function(done) {
        this.httpSpy.getSession.and.returnValue({
          body: JSON.stringify({
            janus: "event",
            sender: "0",
            plugindata: {
              data: "stuff"
            },
            jsep: "jsep"
          })
        })
        this.session.attach("plugin")
        .then((handle) => {
          this.session.poll()
          setTimeout(() => {
            expect(Handle.prototype.emit).toHaveBeenCalledWith("event", {data: "stuff", jsep: "jsep"})
            done()
          }, 100)
        })
      })

      describe("the webrtcup event", function() {

        beforeAll(function() {
          this.payload = {
            janus: "webrtcup",
            session_id: "0",
            sender: "0",
          }
          this.httpSpy.getSession.and.returnValue({
            body: JSON.stringify(this.payload)
          })
        })

        it("dispatches to the session", function(done) {
          this.session.poll()
          setTimeout(() => {
            expect(Session.prototype.emit).toHaveBeenCalledWith("webrtcup", this.payload)
            done()
          }, 100)
        })

        it("dispatches to the handle", function(done) {
          this.session.attach("plugin")
          .then((handle) => {
            this.session.poll()
            setTimeout(() => {
              expect(Handle.prototype.emit).toHaveBeenCalledWith("webrtcup", this.payload)
              done()
            }, 100)
          })
        })

      })

      describe("the media event", function() {

        beforeAll(function() {
          this.payload = {
            janus: "media",
            session_id: "0",
            sender: "0",
          }
          this.httpSpy.getSession.and.returnValue({
            body: JSON.stringify(this.payload)
          })
        })

        it("dispatches to the session", function(done) {
          this.session.poll()
          setTimeout(() => {
            expect(Session.prototype.emit).toHaveBeenCalledWith("media", this.payload)
            done()
          }, 100)
        })

        it("dispatches to the handle", function(done) {
          this.session.attach("plugin")
          .then((handle) => {
            this.session.poll()
            setTimeout(() => {
              expect(Handle.prototype.emit).toHaveBeenCalledWith("media", this.payload)
              done()
            }, 100)
          })
        })

      })

      describe("the hangup event", function() {

        beforeAll(function() {
          this.payload = {
            janus: "hangup",
            session_id: "0",
            sender: "0",
          }
          this.httpSpy.getSession.and.returnValue({
            body: JSON.stringify(this.payload)
          })
        })

        it("dispatches to the session", function(done) {
          this.session.poll()
          setTimeout(() => {
            expect(Session.prototype.emit).toHaveBeenCalledWith("hangup", this.payload)
            done()
          }, 100)
        })

        it("dispatches to the handle", function(done) {
          this.session.attach("plugin")
          .then((handle) => {
            this.session.poll()
            setTimeout(() => {
              expect(Handle.prototype.emit).toHaveBeenCalledWith("hangup", this.payload)
              done()
            }, 100)
          })
        })

      })

    })

    describe("destroy", function() {

      it("throws if polling a destroyed session is attempted", function() {
        this.session.destroy()
        expect(() => this.destroy()).toThrow()
      })

      it("emits the destroying and destroyed events", function(done) {
        this.session.destroy()
        setTimeout(() => {
          expect(Session.prototype.emit).toHaveBeenCalledWith("destroying")
          expect(Session.prototype.emit).toHaveBeenCalledWith("destroyed")
          done()
        }, 100)
      })

      it("destroys attached plugins", function(done) {
        this.session.attach("plugin")
        .then((handle) => {
          this.session.destroy()
          setTimeout(() => {
            expect(Handle.prototype.emit).toHaveBeenCalledWith("destroying")
            expect(Handle.prototype.emit).toHaveBeenCalledWith("destroyed")
            done()
          }, 100)
        })
      })

      it("calls the API to destroy the session", function(done) {
        this.session.destroy()
        .then(() => {
          expect(fetch).toHaveBeenCalledWith(`${this.endpoint}/0`, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              janus: "destroy",
              transaction: this.transactionId
            })
          })
          done()
        })
      })

      it("handles errors", function(done) {
        const reason = "boo"
        this.httpSpy.postSession.and.returnValue({
          body: JSON.stringify({
            janus: "error",
            error: {reason}
          })
        })
        this.session.destroy()
        setTimeout(() => {
          expect(Session.prototype.emit).toHaveBeenCalledWith("error", new Error(reason))
          done()
        }, 100)
      })

    })
  })

})
