import { useState, useEffect, MouseEvent } from 'react';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

interface ToolbarMenuProps {
  header: string;
  description: string;
  options: string[];
  setExternalState: (color: string) => void;
}

function ToolbarMenu({ header, description, options, setExternalState }: ToolbarMenuProps) {
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

  useEffect(() => {
    setExternalState(optionList[selectedIndex]);
  });

  return (
    <div>
      <Button color="inherit" onClick={handleClick}>{header}:<br/>{optionList[selectedIndex]}</Button>
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

export default ToolbarMenu;
