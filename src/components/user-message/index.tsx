import { Chip } from "@mui/material";

interface UserMessageProps {
  message: string;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <Chip
        label={message}
        sx={{
          fontSize: "1rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "2rem",
          backgroundColor: "#F0F0F0",
          color: "#333",
          height: "auto",
          "& .MuiChip-label": {
            display: "block",
            whiteSpace: "normal",
          },
        }}
      />
    </div>
  );
}
