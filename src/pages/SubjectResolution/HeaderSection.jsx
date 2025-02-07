import React from 'react';
import Button from '@mui/material/Button';
import { Download, NavigateNext, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HeaderSection = ({
  title,
  isVideoReady,
  boundingBoxes,
  persons,
  fps,
  moveToNextScreen,
  fileName,
}) => {
  const navigate = useNavigate();

  const downloadConfig = () => {
    const data = { fps, boundingBoxes, persons };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName.replace(/\.[^/.]+$/, '') + '_subject_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const buttonStyle = {
    backgroundColor: '#2563eb',
    color: '#fff',
    textTransform: 'none',
    fontWeight: 'bold',
    '&:hover': { backgroundColor: '#1d4ed8' },
  };

  return (
    <div
      className={`flex px-8 h-[8vh] items-center ${
        isVideoReady ? 'justify-between' : 'justify-center'
      } bg-gray-500`}
    >
      <div className="text-3xl text-white font-semibold font-mono">{title}</div>
      {isVideoReady && (
        <div className="flex gap-2">
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={buttonStyle}
          >
            BACK
          </Button>
          <Button
            variant="contained"
            onClick={downloadConfig}
            disabled={boundingBoxes.length === 0}
            startIcon={<Download />}
            sx={{
              ...buttonStyle,
              '&:disabled': {
                backgroundColor: '#94a3b8',
                color: '#cbd5e1',
              },
            }}
          >
            CONFIG
          </Button>
          <Button
            variant="contained"
            onClick={moveToNextScreen}
            endIcon={<NavigateNext />}
            disabled={boundingBoxes.length === 0}
            sx={{
              ...buttonStyle,
              '&:disabled': {
                backgroundColor: '#94a3b8',
                color: '#cbd5e1',
              },
            }}
          >
            PROCEED
          </Button>
        </div>
      )}
    </div>
  );
};

export default HeaderSection;
