import React from "react";
import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface CopilotButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

const CopilotButton: React.FC<CopilotButtonProps> = ({
  onClick,
  children = "Get help from Jarvis",
}) => {
  return (
    <Button
      variant="contained"
      endIcon={<AutoAwesomeIcon />}
      onClick={onClick}
      sx={{
        backgroundColor: "#5C6BC0",
        borderRadius: "40px",
        textTransform: "none",
        fontWeight: 550,
        fontSize: "1rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        px: 2.5,
        py: 1,
        "&:hover": {
          backgroundColor: "#3F51B5",
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
        },
      }}
    >
      {children}
    </Button>
  );
};

export default CopilotButton;
