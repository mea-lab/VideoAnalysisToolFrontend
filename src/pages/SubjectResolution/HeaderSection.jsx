// src/pages/SubjectResolution/HeaderSection.jsx
import Button from '@mui/material/Button';
import { Download, NavigateNext } from '@mui/icons-material';

const HeaderSection = ({
  title,
  isVideoReady,
  boundingBoxes,
  persons,
  fps,
  moveToNextScreen,
  fileName,
}) => {
  const downloadConfig = () => {
    const fileData = {
      fps: fps,
      boundingBoxes: boundingBoxes,
      persons: persons,
    };

    const json = JSON.stringify(fileData);
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

  return (
    <div
      className={`flex px-8 h-[8vh] items-center ${
        isVideoReady ? 'justify-between' : 'justify-center'
      } bg-gray-500`}
    >
      <div className="text-3xl text-white font-semibold font-mono">
        {title}
      </div>
      {isVideoReady && (
        <div className="flex gap-2">
          <Button
            variant="contained"
            onClick={downloadConfig}
            startIcon={<Download />}
            sx={{
              backgroundColor: '#2563eb', // Tailwind's "blue-600"
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#1d4ed8', // Tailwind's "blue-700"
              },
            }}
          >
            CONFIG
          </Button>
          <Button
            variant="contained"
            onClick={moveToNextScreen}
            endIcon={<NavigateNext />}
            sx={{
              backgroundColor: '#2563eb',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#1d4ed8',
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
  