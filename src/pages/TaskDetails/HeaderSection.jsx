//src/pages/TaskDetails/HeaderSection.jsx
import { ArrowBack } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { HeaderTitle } from '../../components/commons/HeaderSection';


const HeaderSection = ({ title, isVideoReady }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-slate-700 rounded-b-md py-4 px-8 shadow-lg">
      <div className={`mx-auto flex items-center ${isVideoReady ? 'justify-between' : 'justify-center'}`}>
      <HeaderTitle>{title}</HeaderTitle>
        
        {isVideoReady && (
          <Button
            variant="contained"
            onClick={() => navigate('/tasks')}
            startIcon={<ArrowBack />}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1
            }}
          >
            Back to Tasks
          </Button>
        )}
      </div>
    </header>
  );
};


export default HeaderSection;
