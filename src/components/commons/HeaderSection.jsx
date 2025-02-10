// src/components/commons/HeaderSection.jsx
import { Typography } from '@mui/material';

export const HeaderTitle = ({ children }) => (
  <Typography variant="h4" className="text-white font-bold font-sans">
    {children}
  </Typography>
);