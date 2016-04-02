import EventEmitter from "eventemitter3"

const getTransactionId = () => (Math.random()*10000000).toFixed().toString()

const janusFetch = (endpoint, args) => {
  return fetch(endpoint, args)
  .then((r) => r.json())
  .then((r) => {
    if(r.janus == "error")
      throw new Error(r.error.reason)
    else
      return r
  })
}

class Session extends EventEmitter {

  constructor(endpoint) {
    super()
    super()
    this.endpoint = endpoint
    this.handles = {}
    this.destroyed = false
    fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        janus: "create",
        transaction: getTransactionId()
      })
    }).then((r) => r.json())
    .then((r) => r.data.id)
    .then((id) => {
      this.sessionId = id
      this.emit("connected")
      this._poll()
    })
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
      if(this.destroyed) {
        console.log("Destroying")
        this.emit("destroyed")
      } else
        this._poll()
    })
  }

  attach(pluginId) {
    return janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify({
        janus: "attach",
        plugin: pluginId,
        transaction: getTransactionId()
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
          transaction: getTransactionId()
        })
      }).then(() => this.emit("destroyed"))
    })
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
    const payload = {janus: "message", transaction: getTransactionId()}
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
    const body = {janus: "trickle", transaction: getTransactionId()}
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
        transaction: getTransactionId()
      })
    })
  }

  destroy() {
    this.emit("destroying")
    janusFetch(this.fullEndpoint(), {
      method: "POST",
      body: JSON.stringify({
        janus: "detach",
        transaction: getTransactionId()
      })
    }).then((r) => this.emit("destroyed"))
  }

}

module.exports = session
