import React from "react";
import docker from "docker-browser-console";
import WebSocketStream from "websocket-stream";
import { setTimeout } from "core-js/library/web/timers";
import { homedir } from "os";

const dev = process.env.NODE_ENV !== "production";
const host = dev ? "localhost" : "adaweb.gonzaga.edu";
const websocketProtocal = dev ? "ws://" : "wss://";

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: "0",
      cwd: "~",
      user: "",
      fileHover: false
    };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ height: window.innerHeight - 48 });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.cwd != this.state.cwd || prevState.user != this.state.user) {
      this.props.changeHeader(
        this.props.value,
        this.state.user + "@ada: " + this.state.cwd
      );
    }
  }

  componentDidMount() {
    this.setState({ height: window.innerHeight - 48 });
    this.updateWindowDimensions();

    window.addEventListener("resize", this.updateWindowDimensions);
    // create a stream for any docker image

    // use docker({style:false}) to disable default styling
    // all other options are forwarded to the term.js instance
    const terminal = docker();

    const pingWS = new WebSocket(
      websocketProtocal + host + ":8081?session=" + this.props.session
    );
    pingWS.onmessage = event => {
      pingWS.send(event.data);
    };

    const ws = WebSocketStream(
      websocketProtocal + host + ":8080?session=" + this.props.session
    );
    ws.socket.addEventListener("error", e => {
      this.componentDidMount();
    });

    ws.socket.addEventListener("onclose", e => {
      this.componentDidMount();
    });

    ws.socket.addEventListener("message", e => {
      const decoder = new TextDecoder();
      const decoded = decoder.decode(e.data);
      console.log(decoded)
      const pathRegex = new RegExp("@ada: (.*)\\\\u0007\\\\u001b\\[01;32m");
      const userRegex = new RegExp("\\\\u001b]0;(.*)@ada:");
      const path = pathRegex.exec(decoded);
      const user = userRegex.exec(decoded);

      path ? this.setState({ cwd: path[1] }) : false;
      user ? this.setState({ user: user[1] }) : false;
    });
    // connect to a docker-browser-console server
    terminal.pipe(ws).pipe(terminal);

    // append the terminal to a DOM element
    terminal.appendTo(this.refs.container);

    setTimeout(() => {
      let event = document.createEvent("HTMLEvents");
      event.initEvent("resize", true, false);
      window.dispatchEvent(event);
    }, 100);

    let that = this;
    new Dropzone(this.refs.container, {
      url: "/upload?session=" + this.props.session,
      uploadMultiple: false,
      createImageThumbnails: false,
      previewTemplate: '<div style="display:none"></div>',

      init: function () {
        this.on("addedfile", file => {
          console.log(file);
        });
        this.on("dragenter", event => {
          that.setState({ fileHover: true });
        });
        this.on("dragleave", event => {
          that.setState({ fileHover: false });
        });
        this.on("sending", (file, xhr, formData) => {
          console.log(formData);
          formData.append(
            "data",
            JSON.stringify({
              user: that.state.user,
              path: that.state.cwd,
              fullPath: that.state.cwd + "/" + (file.fullPath || file.name)
            })
          );
        });
      }
    });
  }

  previewTemplate(e) {
    console.log(e);
  }

  getUser(decoded) {
    return decoded.split("\\u0007")[1].split("@ada")[0];
  }

  render() {
    return (
      <div
        style={{
          height: this.props.currentValue == this.props.value ? "auto" : "0",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: this.state.height
          }}
          className={"docker-browser-console"}
          ref={"container"}
        />
      </div>
    );
  }
}
