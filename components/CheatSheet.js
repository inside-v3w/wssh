import Axios from "axios";
import ReactMarkdown from "react-markdown";

export default class CheatSheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = { markdown: "", height: 0 };
  }

  componentDidMount() {
    Axios.get("/static/cheatsheet.md").then(res => {
      this.setState({ markdown: res.data });
    });
  }

  render() {
    return (
      <div
        className="markdown-body"
        style={{
          width: this.props.helping ? "40%" : "0",
          height: this.props.height,
          display: this.props.helping ? "block" : "none",
          float: "right",
          overflowY: "auto",
          paddingLeft: 16,
          paddingRight: 16
        }}
      >
        <ReactMarkdown source={this.state.markdown} />
      </div>
    );
  }
}
