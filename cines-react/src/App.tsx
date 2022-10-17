import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Graph from './Graph';
import Toolbar from '@mui/material/Toolbar';
import ToolbarMenu from './ToolbarMenu';
import Typography from '@mui/material/Typography';
import './App.css';

function App() {
  const [nodeColor, setNodeColor] = useState("");
  const [edgeColor, setEdgeColor] = useState("");
  const [layout, setLayout] = useState("");

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1}}>
            CINES Playground
          </Typography>
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
            options={["force", "circle", "kaluza-klein manifold"]}
            setExternalState={setLayout}
          />
        </Toolbar>
      </AppBar>
      <Graph
        nodeColor={nodeColor}
        edgeColor={edgeColor}
        layout={layout}
      />
    </Box>
  );
}

export default App;
