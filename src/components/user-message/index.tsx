import { Chip } from "@mui/material";

interface UserMessageProps {
  message: string;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
      <div style={{
        background: '#fff',
        color: '#232326',
        borderRadius: '12px',
        padding: '0.75rem 1.25rem',
        fontSize: '1.08rem',
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        maxWidth: '80%',
        lineHeight: 1.6,
        letterSpacing: 0.01,
        wordBreak: 'break-word',
        border: '1px solid #E0E0E0',
      }}>{message}</div>
    </div>
  );
}
