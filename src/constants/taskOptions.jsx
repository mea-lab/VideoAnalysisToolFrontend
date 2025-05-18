// src/constants/taskOptions.jsx
const taskFiles = import.meta.glob(
  '../pages/TaskDetails/Tasks/*.jsx',
  { eager: true }
);

export const taskOptions = Object.keys(taskFiles).map((filePath) => {
  const filename = filePath.split('/').pop();
  const name = (filename
    .replace(/\.(jsx)$/, '')
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  )

  return {
    label: name,
    value: name,
  };
});


//Keep for ideas for new tasks to implement
 const oldTaskOptions = [
  { label: 'Gait', value: 'Gait' },
  { label: 'Hand Movement Left', value: 'Hand movement Left' },
  { label: 'Hand Movement Right', value: 'Hand movement Right' },
  { label: 'Dynamic tremor', value: 'Dynamic tremor' },
  { label: 'Mouth Opening', value: 'Mouth Opening' },
  { label: 'Toe tapping Left', value: 'Toe tapping Left' },
  { label: 'Toe tapping Right', value: 'Toe tapping Right' },
  { label: 'Passage', value: 'Passage' },
  { label: 'Free speech', value: 'Free speech' },
  { label: 'Hand Tremor', value: 'Hand Tremor' },
  { label: 'Finger Tap Left', value: 'Finger Tap Left' },
  { label: 'Finger Tap Right', value: 'Finger Tap Right' },
  { label: 'Hand pronation', value: 'Hand pronation' },
  { label: 'Phonation', value: 'Phonation' },
  { label: 'Postural tremor', value: 'Postural tremor' },
  { label: 'DDK', value: 'DDK' },
  { label: 'Eyebrow elevation', value: 'Eyebrow elevation' },
  { label: 'Picture Description', value: 'Picture Description' },
  { label: 'Rest tremor', value: 'Rest tremor' },
  { label: 'Leg agility Left', value: 'Leg agility Left' },
  { label: 'Leg agility Right', value: 'Leg agility Right' },
  { label: 'Lips spread', value: 'Lips spread' },
  { label: 'Arising from chair', value: 'Arising from chair' },
];