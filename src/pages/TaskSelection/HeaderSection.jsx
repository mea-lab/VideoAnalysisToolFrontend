import { Download, NavigateNext, ArrowBack} from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';



const HeaderSection = ({
  title,
  isVideoReady,
  boundingBoxes,
  persons,
  fileName,
  fps,
  moveToNextScreen,
  taskBoxes,
}) => {
  const navigate = useNavigate();

  const downloadConfig = () => {
    const fileData = {
      fps: fps,
      boundingBoxes: boundingBoxes,
      tasks: taskBoxes,
    };

    const json = JSON.stringify(fileData);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = fileName.replace(/\.[^/.]+$/, '') + '_task_data.json';
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
          onClick={() => navigate('/subjects')} // or any desired previous route
          startIcon={<ArrowBack />}
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
          BACK
        </Button>



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
          disabled={taskBoxes.length === 0}  // Add disabled condition
          sx={{
            backgroundColor: '#2563eb',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#1d4ed8',
            },
            // Add disabled state styling
            '&:disabled': {
              backgroundColor: '#94a3b8',  // Tailwind's "slate-400"
              color: '#cbd5e1',  // Tailwind's "slate-300"
              cursor: 'not-allowed'
            }
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
