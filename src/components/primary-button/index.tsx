import { Button, ButtonProps } from "@mui/material";
import { ReactNode } from "react";

interface PrimaryButtonProps extends ButtonProps {
  children: ReactNode;
}

export default function PrimaryButton({
  children,
  endIcon,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      variant="contained"
      endIcon={endIcon}
      sx={{
        backgroundColor: "black",
        color: "white",
        borderRadius: "12px",
        textTransform: "none",
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
