import { IconButton, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import React from "react";

interface PromptBarProps {
  onSubmit: (value: string) => void;
}

export default function PromptBar({ onSubmit }: PromptBarProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleFormSubmit} className="relative flex items-center">
        <TextField
          fullWidth
          id="prompt-input"
          placeholder="Enter your response"
          value={inputValue}
          onChange={handleInputChange}
          variant="outlined"
          autoComplete="off"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "9999px",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              "& fieldset": {
                border: "1px solid #E0E0E0",
              },
              "&:hover fieldset": {
                borderColor: "#B0B0B0",
              },
              "&.Mui-focused fieldset": {
                border: "1px solid #6083F7",
              },
            },
            "& .MuiOutlinedInput-input": {
              padding: "12px 60px 12px 20px",
              fontSize: "1rem",
            },
          }}
        />
        <IconButton
          type="submit"
          aria-label="send"
          sx={{
            position: "absolute",
            right: "8px",
            color: "#a0a0a0",
            "&:hover": {
              color: "black",
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </form>
    </div>
  );
}
