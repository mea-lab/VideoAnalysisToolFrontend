import { RestartAlt, TouchApp } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import Creatable from 'react-select/creatable';
import { useState } from 'react';

const taskOptions = [
  { label: 'Gait', value: 'Gait' },
  { label: 'Hand movement - Left', value: 'Hand movement - Left' },
  { label: 'Hand movement - Right', value: 'Hand movement - Right' },
  { label: 'Dynamic tremor', value: 'Dynamic tremor' },
  { label: 'Mouth Opening', value: 'Mouth Opening' },
  { label: 'Toe tapping - Left', value: 'Toe tapping - Left' },
  { label: 'Toe tapping - Right', value: 'Toe tapping - Right' },
  { label: 'Passage', value: 'Passage' },
  { label: 'Free speech', value: 'Free speech' },
  { label: 'Hand Tremor', value: 'Hand Tremor' },
  { label: 'Finger Tap - Left', value: 'Finger Tap - Left' },
  { label: 'Finger Tap - Right', value: 'Finger Tap - Right' },
  { label: 'Hand pronation', value: 'Hand pronation' },
  { label: 'Phonation', value: 'Phonation' },
  { label: 'Postural tremor', value: 'Postural tremor' },
  { label: 'DDK', value: 'DDK' },
  { label: 'Eyebrow elevation', value: 'Eyebrow elevation' },
  { label: 'Picture Description', value: 'Picture Description' },
  { label: 'Rest tremor', value: 'Rest tremor' },
  { label: 'Leg agility - Left', value: 'Leg agility - Left' },
  { label: 'Leg agility - Right', value: 'Leg agility - Right' },
  { label: 'Lips spread', value: 'Lips spread' },
  { label: 'Arising from chair', value: 'Arising from chair' },
];

const Task = ({
  task,
  onFieldChange,
  onTaskDelete,
  onTimeMark,
  onTimeClick,
  options,
  setOptions,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const getSelectBorderColor = () => {
    if (selectedOption === null) return 'gray';

    let flag = false;
    options.forEach(option => {
      if (option.value === selectedOption.value) {
        flag = true;
      }
    });

    return flag ? 'green' : 'red';
  };
  
  const handleTaskChange = selectedTask => {
    setSelectedOption(selectedTask);
    onFieldChange(selectedTask.value, 'name', task);
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-2 border-b border-gray-200" key={task.id}>
      <div className="w-full sm:w-2/5 min-w-[150px] max-w-[400px] mb-2 sm:mb-0">
        <Creatable
          options={options}
          value={{ label: task.name, value: task.name }}
          onChange={handleTaskChange}
          placeholder={'Select or add'}
          blurInputOnSelect
          styles={{
            control: (baseStyles) => ({
              ...baseStyles,
              borderColor: getSelectBorderColor(),
              borderWidth: 2,
              minHeight: '38px',
            }),
            container: (baseStyles) => ({
              ...baseStyles,
              width: '100%',
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              zIndex: 10,
            }),
          }}
        />
      </div>
      
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center mr-4 w-28 sm:w-32">
          <input
            className="p-2 w-20 sm:w-24 text-center border rounded"
            type="number"
            onChange={e => onFieldChange(e.target.value, 'start', task)}
            onDoubleClick={() => onTimeClick(task.start)}
            min={0}
            step={0.001}
            value={task.start}
          />
          <IconButton
            size="small"
            aria-label="mark start"
            title="Mark start time"
            onClick={() => onTimeMark('start', task)}
          >
            <TouchApp fontSize="small" />
          </IconButton>
        </div>
        
        <div className="flex items-center mr-4 w-28 sm:w-32">
          <input
            className="p-2 w-20 sm:w-24 text-center border rounded"
            type="number"
            onChange={e => onFieldChange(e.target.value, 'end', task)}
            onDoubleClick={() => onTimeClick(task.end)}
            min={0}
            step={0.001}
            value={task.end}
          />
          <IconButton
            size="small"
            aria-label="mark end"
            title="Mark end time"
            onClick={() => onTimeMark('end', task)}
          >
            <TouchApp fontSize="small" />
          </IconButton>
        </div>
        
        <button
          className="p-1 sm:p-2 px-2 sm:px-3 rounded-md bg-red-600 text-white font-bold text-sm sm:text-base flex-shrink-0"
          onClick={() => onTaskDelete(task)}
          aria-label="Delete task"
        >
          X
        </button>
      </div>
    </div>
  );
};

const TaskListLabels = ({ resetTaskSelection }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-2 items-start sm:items-center border-b-2 border-gray-300 pb-2 mb-2">
      <div className="font-bold text-lg w-full sm:w-2/5 min-w-[150px] max-w-[400px]">Task</div>
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center justify-between w-64 sm:w-72">
          <div className="font-bold w-28 sm:w-32 flex items-center">
            <span className="ml-2">Start</span>
          </div>
          <div className="font-bold w-28 sm:w-32 flex items-center">
            <span className="ml-2">End</span>
          </div>
        </div>
        <button
          className="p-1 sm:p-2 px-3 rounded-md bg-blue-500 text-white font-bold flex items-center gap-1"
          onClick={resetTaskSelection}
        >
          <RestartAlt fontSize="small" /> 
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
};

const TaskList = ({
  tasks,
  onTaskChange,
  onTaskDelete,
  videoRef,
  resetTaskSelection,
}) => {
  const [options, setOptions] = useState(taskOptions);

  const onFieldChange = (newValue, fieldName, task) => {
    let newTask = { ...task };

    newTask[fieldName] =
      fieldName === 'start' || fieldName === 'end'
        ? Number(Number(newValue).toFixed(3))
        : newValue;
    onTaskChange(newTask);
  };

  const onTimeMark = (fieldName, task) => {
    let newTask = { ...task };
    newTask[fieldName] = Number(
      Number(videoRef.current?.currentTime || 0).toFixed(3),
    );
    onTaskChange(newTask);
  };

  const onTimeClick = time => {
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  return (
    <div className="px-3 sm:px-6 lg:px-10 flex-1 py-4 flex flex-col gap-2 h-full overflow-y-auto rounded-lg bg-gray-100 shadow-inner">
      <TaskListLabels resetTaskSelection={resetTaskSelection} />
      {tasks.length > 0 ? (
        tasks.map((task, index) => (
          <Task
            key={index}
            task={task}
            onFieldChange={onFieldChange}
            onTaskDelete={onTaskDelete}
            onTimeMark={onTimeMark}
            onTimeClick={onTimeClick}
            options={options}
            setOptions={setOptions}
          />
        ))
      ) : (
        <div className="text-center text-gray-500 py-4">No tasks added yet</div>
      )}
    </div>
  );
};

export default TaskList;