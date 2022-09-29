import { useState, MouseEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Graph from './Graph';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import './App.css';

interface ColorMenuProps {
  description: string,
  options: string[],
  setExternalState: (color: string) => void;
}

function ColorMenu({ description, options, setExternalState }: ColorMenuProps) {
  const optionList = [description, ...options];

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const open = Boolean(anchorEl);
  const handleClick = (evt: MouseEvent<HTMLElement>) => {
    setAnchorEl(evt.currentTarget);
  };
  const handleMenuItemClick = (evt: MouseEvent<HTMLElement>, index: number) => {
    setSelectedIndex(index);
    setExternalState(optionList[index]);
    setAnchorEl(null);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  setExternalState(optionList[selectedIndex]);

  return (
    <div>
      <Button color="inherit" onClick={handleClick}>Node color:<br/>{optionList[selectedIndex]}</Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {optionList.map((option, index) => (
          <MenuItem
            key={option}
            disabled={index === 0}
            selected={index === selectedIndex}
            onClick={(event) => handleMenuItemClick(event, index)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

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
          <ColorMenu
            description="Color for nodes"
            options={["firebrick", "seagreen", "skyblue"]}
            setExternalState={setNodeColor}
          />
          <ColorMenu
            description="Color for edges"
            options={["lemonchiffon", "teal", "orchid"]}
            setExternalState={setEdgeColor}
          />
          <ColorMenu
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
