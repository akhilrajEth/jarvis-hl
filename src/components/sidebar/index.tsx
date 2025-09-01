import React, { FC } from "react";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = ["Add to portfolio", "Edit preferences"];

  return (
    <Drawer anchor="left" open={isOpen} onClose={onClose}>
      <Box sx={{ width: 250, pt: 2 }} role="presentation" onClick={onClose}>
        <List>
          {menuItems.map((text) => (
            <ListItem key={text} disablePadding>
              <ListItemButton
                sx={{
                  py: 1.5,
                  px: 2,
                }}
              >
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    letterSpacing: "0.5px",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};
