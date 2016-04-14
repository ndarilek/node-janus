# A Leaner, Cleaner JavaScript API for the [Janus WebRTC Gateway](https://janus.conf.meetecho.com/)

`npm install @ndarilek/janus`

Works on the server via Node, in the browser via any WebRTC library ([WebRTC Adapter](https://github.com/webrtc/adapter) known to work for sure) and, hopefully, [React Native](https://facebook.github.io/react-native/).

## Example

Here is an example of part of the code I use to set up a WebRTC session with Janus in the browser. This is from a React component, with various event-handlers passed in from its container component, and using [Toastr](https://github.com/CodeSeven/toastr) for alerts:

```
navigator.mediaDevices.getUserMedia({audio: true, video: {facingMode: "environment"}})
.then((stream) => {
  console.log("Got stream", stream.getAudioTracks())
  console.log("Attaching", this.refs.localVideo)
  this.refs.localVideo.srcObject = stream
  pc.addStream(stream)
  const session = new Session(this.props.janusEndpoint)
  if(this.props.onSessionCreated)
    this.props.onSessionCreated(session)
  this.setState({session})
  session.on("connected", () => {
    session.attach(this.props.plugin)
    .then((handle) => {
      this.setState({handle})
      if(this.props.onHandleReceived)
        this.props.onHandleReceived(handle)
      pc.createOffer()
      .then(gotOffer)
      handle.on("event", (data) => {
        if(this.props.onHandleEvent)
          this.props.onHandleEvent(data)
        if(data.jsep) {
          pc.setRemoteDescription(new RTCSessionDescription(data.jsep))
        }
      })
    })
  })
  session.on("webrtcup", () => {
    toastr.success("Connected")
    if(this.props.onWebRTCUp)
      this.props.onWebRTCUp()
  })
  session.on("media", (data) => {
    if(this.props.onMediaStateChanged)
      this.props.onMediaStateChanged(data)
  })
  session.on("hangup", () => {
    toastr.success("Disconnected")
    if(this.props.onHangup)
      this.props.onHangup()
  })
  session.on("destroyed", () => {
    toastr.success("Disconnected")
    if(this.props.onHangup)
      this.props.onHangup()
  })
})
```

## API

### Session

`Session` represents the entrypoint into the Janus API. In addition to creating new plugin `Handle` instances, `Session` also long-polls the Janus API for new events.

#### Methods

#### Events

### Handle

A `Handle` is obtained by attaching to a plugin from a `Session`. It supports directly messaging plugins, in addition to receiving plugin-specific events.

#### Methods

#### Events

