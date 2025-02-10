//src/pages/TaskDetails/HeaderSection.jsx
import { ArrowBack } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

const HeaderSection = ({
  title,
  isVideoReady,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={`flex px-8 h-[8vh] items-center ${
        isVideoReady ? 'justify-between' : 'justify-center'
      } bg-gray-500`}
    >
      <div className="text-3xl text-white font-semibold font-mono">{title}</div>
      {isVideoReady && (
        <div className="flex gap-2">
          {/* Back Button */}
          <Button
            variant="contained"
            onClick={() => navigate('/tasks')}
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
        </div>
      )}
    </div>
  );
};

export default HeaderSection;
