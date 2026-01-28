import Diff from "./components/diff";
import Nav from "./components/nav";
import Query from "./components/query";
import Upload from "./components/upload";

function App() {
  return (
    <div className="App">
      <Nav />
      <div className="wrapper">
        <Upload />
        <Query />
        <Diff />
      </div>
    </div>
  );
}

export default App;
