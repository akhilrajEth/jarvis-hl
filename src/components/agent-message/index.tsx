import { Avatar, Chip } from "@mui/material";

interface AgentMessageProps {
  message: string;
}

export default function AgentMessage({ message }: AgentMessageProps) {
  return (
    <div className="flex items-center space-x-3">
      <Avatar sx={{ bgcolor: "#6083F7", width: 40, height: 40 }}>J</Avatar>
      <Chip
        label={message}
        variant="outlined"
        sx={{
          fontSize: "1rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "2rem",
          borderColor: "#E0E0E0",
          backgroundColor: "white",
          "& .MuiChip-label": {
            padding: 0,
            display: "block",
            whiteSpace: "normal",
          },
          height: "auto",
        }}
      />
    </div>
  );
}
