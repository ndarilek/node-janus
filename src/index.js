import _ from "lodash"
import EventEmitter from "eventemitter3"

const getTransactionId = () => (Math.random()*10000000).toFixed().toString()

const janusFetch = (endpoint, args) => Session.fetch(
  endpoint, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    ...args
  }).then((r) => r.json())
  .then((r) => {
    if(r.janus == "error")
      throw new Error(r.error.reason)
    else
      return r
  }).catch(console.error)

class Session extends EventEmitter {

  constructor(endpoint) {
    super()
    if(!endpoint)
      throw new Error("Must specify an endpoint")
    if(typeof(endpoint) != "string")
      throw new Error("`endpoint` is not a string")
    if(typeof Session.fetch === "undefined") {
      if(typeof fetch != "undefined") {
        Session.fetch = fetch
        console.warn("Setting .fetch property to the global value. Set it explicitly if things behave oddly.")
      } else if(typeof window != "undefined" && window.fetch) {
        Session.fetch = window.fetch.bind(window)
        console.warn("Setting .fetch property to the value of window.fetch. Set it explicitly if things behave oddly.")
      } else
        throw new Error("No fetch implementation configured. Please set the .fetch static property on this class to an implementor of the fetch specification.")
    }
    this.endpoint = endpoint
    this.handles = {}
    this.destroyed = false
    if(!Session.getTransactionId)
      Session.getTransactionId = getTransactionId
    janusFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        janus: "create",
        transaction: Session.getTransactionId()
      })
    }).then((r) => r.data.id)
    .then((id) => {
      this.sessionId = id
      this.emit("connected")
      this._poll()
    }).catch(console.error)
  }

  fullEndpoint() {
    return `${this.endpoint}/${this.sessionId}`
  }

  _poll() {
    janusFetch(this.fullEndpoint())
    .then((r) => {
      let handle = null
      if(r.sender && this.handles[r.sender])
        handle = this.handles[r.sender]
      if(r.janus == "event" && handle) {
        const payload = {}
        if(r.plugindata && r.plugindata.data)
          payload.data = r.plugindata.data
        if(r.jsep)
          payload.jsep = r.jsep
        handle.emit("event", payload)
      } else if(r.janus == "webrtcup") {
        this.emit("webrtcup", r)
        if(handle)
          handle.emit("webrtcup")
      } else if(r.janus == "media") {
        this.emit("media", r)
        if(handle)
          handle.emit("media", r)
      } else if(r.janus == "hangup")  {
        this.emit("hangup", r)
        if(handle)
          handle.emit("hangup")
      }
      if(!this.destroyed)
        this._poll()
    })
  }

  attach(pluginId) {
    return janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify({
        janus: "attach",
        plugin: pluginId,
        transaction: Session.getTransactionId()
      })
    }).then((r) => {
      const id = r.data.id
      const h = new Handle(this, id)
      this.handles[id] = h
      return h
    })
  }

  destroy() {
    this.emit("destroying")
    this.destroyed = true
    Promise.all(_.values(this.handles).map((h) => h.destroy()))
    .then(() => {
      janusFetch(this.fullEndpoint(), {
        method: "POST",
        body: JSON.stringify({
          janus: "destroy",
          transaction: Session.getTransactionId()
        })
      })
    }).then(() => this.emit("destroyed"))
  }

}

class Handle extends EventEmitter {

  constructor(session, id) {
    super()
    this.session = session
    this.id = id
  }

  fullEndpoint() {
    return `${this.session.fullEndpoint()}/${this.id}`
  }

  message(body, jsep) {
    const payload = {janus: "message", transaction: Session.getTransactionId()}
    if(body)
      payload.body = body
    else
      payload.body = {}
    if(jsep)
      payload.jsep = jsep
    return janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify(payload)
    })
  }

  trickle(candidates) {
    const body = {janus: "trickle", transaction: Session.getTransactionId()}
    if(!candidates)
      body.candidate = {completed: true}
    else if(candidates.constructor == Array)
      body.candidates = candidates
    else if(typeof(candidates) == "object")
      body.candidate = candidates
    return janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify(body)
    })
  }

  hangup() {
    return janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify({
        janus: "hangup",
        transaction: Session.getTransactionId()
      })
    })
  }

  destroy() {
    this.emit("destroying")
    janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify({
        janus: "detach",
        transaction: Session.getTransactionId()
      })
    }).then((r) => this.emit("destroyed"))
  }

}

module.exports = Session
