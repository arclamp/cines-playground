import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import './App.css';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1}}>
            CINES Playground
          </Typography>
          <Button color="inherit">Node color</Button>
          <Button color="inherit">Edge color</Button>
          <Button color="inherit">Layout</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default App;
