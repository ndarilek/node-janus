import {Promise} from "es6-promise"
import * as EventEmitter from "eventemitter3"
import fetch from "isomorphic-fetch"
import * as _ from "lodash"
import objectAssign = require("object-assign")

export {EventEmitter}

const getTransactionId = (): string => (Math.random()*10000000).toFixed().toString()

const janusFetch = (endpoint: string, args?: Object): Promise<any> => fetch(
  endpoint, objectAssign({
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  }, args)).then((r) => r.json())
  .then((r) => {
    if(r.janus == "error")
      throw new Error(r.error.reason)
    else
      return r
  })

interface EventPayload {
  data?: Object
  jsep?: Object
}

interface Handles {
  [id: number]: Handle
}

export default class Session extends EventEmitter {

  static getTransactionId: () => string = getTransactionId

  private handles: Handles = {}

  destroyed = false

  sessionId: number

  constructor(private endpoint: string) {
    super()
    if(!endpoint || endpoint.length == 0)
      throw new Error("Endpoint not specified")
    if(typeof(endpoint) != "string")
      throw new Error("Endpoint not a string")
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

  fullEndpoint(): string {
    return `${this.endpoint}/${this.sessionId}`
  }

  _poll() {
    janusFetch(this.fullEndpoint())
    .then((r) => {
      let handle = null
      if(r.sender && this.handles[r.sender])
        handle = this.handles[r.sender]
      if(r.janus == "event" && handle) {
        const payload: EventPayload = {}
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

  attach(pluginId: string) {
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
    Promise.all(_.values(this.handles).map((h: Handle) => h.destroy()))
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

interface CandidatePayload {
  janus: string
  transaction: string
  candidate?: Object
  candidates?: Array<any>
}

interface MessagePayload {
  janus: string
  transaction: string
  body?: any
  jsep?: Object
}

export class Handle extends EventEmitter {

  constructor(private session: Session, private id: number) {
    super()
  }

  fullEndpoint() {
    return `${this.session.fullEndpoint()}/${this.id}`
  }

  message(body: Object, jsep: Object) {
    const payload: MessagePayload = {janus: "message", transaction: Session.getTransactionId()}
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
    const body: CandidatePayload = {janus: "trickle", transaction: Session.getTransactionId()}
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
