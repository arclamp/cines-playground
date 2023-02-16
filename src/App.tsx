import { useEffect, useState, useRef } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Graph from './Graph';
import Toolbar from '@mui/material/Toolbar';
import ToolbarMenu from './ToolbarMenu';
import Typography from '@mui/material/Typography';
import { fetchNetworkData, getNetwork } from './util';
import { layouts } from './layout';
import './App.css';

import type { GraphData } from './types';

const emptyGraph = {
  nodes: [],
  edges: [],
};

function App() {
  const [nodeColor, setNodeColor] = useState("");
  const [edgeColor, setEdgeColor] = useState("");
  const [layout, setLayout] = useState("");
  const [graphDataset, setGraphDataset] = useState("");
  const [graphData, setGraphData] = useState<GraphData>(emptyGraph);
  const graph = useRef<Graph>(null);

  // Process new grqph data when the selection changes.
  useEffect(() => {
    const processData = async () => {
      if (graphDataset) {
        const networkData = await fetchNetworkData(graphDataset);
        setGraphData(getNetwork(networkData));
      } else {
        setGraphData(emptyGraph);
      }
    };

    processData();
  }, [graphDataset]);

  const zoomToFit = () => {
    if (!graph.current) {
      throw new Error("Graph not initialized");
    }

    graph.current.zoomToFit();
  };

  const screencap = async () => {
    if (!graph.current) {
      throw new Error("Graph not initialized");
    }

    const imageURL = await graph.current.screencap();

    const link = document.createElement("a");
    link.href = imageURL;
    link.download = "graph.png";
    link.click();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1}}>
            CINES Playground
          </Typography>

          <Button color="inherit" onClick={screencap}>Export to PNG</Button>

          <Button color="inherit" onClick={zoomToFit}>Zoom to Fit</Button>

          <ToolbarMenu
            header="Dataset"
            description="Graph dataset"
            options={["network.dat"]}
            setExternalState={setGraphDataset}
          />

          <ToolbarMenu
            header="Node color"
            description="Color for nodes"
            options={["firebrick", "seagreen", "skyblue"]}
            setExternalState={setNodeColor}
          />
          <ToolbarMenu
            header="Edge color"
            description="Color for edges"
            options={["lemonchiffon", "teal", "orchid"]}
            setExternalState={setEdgeColor}
          />
          <ToolbarMenu
            header="Layout"
            description="Select a layout"
            options={["force", ...layouts]}
            setExternalState={setLayout}
          />
        </Toolbar>
      </AppBar>
      <Graph
        data={graphData}
        nodeColor={nodeColor}
        edgeColor={edgeColor}
        layout={layout}
        ref={graph}
      />
    </Box>
  );
}

export default App;
