import React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PsychologyIcon from "@mui/icons-material/Psychology";

interface ReasoningAccordionProps {
  reasoning: string;
  title?: string;
}

const ReasoningAccordion: React.FC<ReasoningAccordionProps> = ({
  reasoning,
  title = "View Reasoning Behind This Portfolio",
}) => {
  return (
    <Accordion
      variant="outlined"
      sx={{
        borderRadius: 2,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="reasoning-panel-content"
        id="reasoning-panel-header"
      >
        <div className="flex items-center gap-2">
          <PsychologyIcon color="action" />
          <Typography fontWeight={500}>{title}</Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <Typography color="text.secondary">{reasoning}</Typography>
      </AccordionDetails>
    </Accordion>
  );
};

export default ReasoningAccordion;
