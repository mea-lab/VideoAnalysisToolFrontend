// src/pages/TaskDetails/ScatterPlot.jsx
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { CloudDownload } from '@mui/icons-material';
import Button from '@mui/material/Button';


const ScatterPlot = ({ taskRecord, taskName }) => {
  const [plotlyData, setPlotlyData] = useState([]);
  const [plotlyLayout, setPlotlyLayout] = useState({});
  const [plotlyConfig, setPlotlyConfig] = useState({});
  const [tableView, setTableView] = useState(true);

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  

  useEffect(() => {
    let data = [
      {
        type: 'scatterpolar',
        r: taskRecord.radar.A,
        theta: taskRecord.radar.labels,
        fill: 'toself',
        name: 'Group A',
      },
      {
        type: 'scatterpolar',
        r: taskRecord.radar.B,
        theta: taskRecord.radar.labels,
        fill: 'toself',
        name: 'Group B',
      },
    ];

    let layout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 10],
        },
      },
      showlegend: false,
      autosize: false,
      height: 300,
      width: 350,
      plot_bgcolor: '#E4E4E4', // Color of the plot area
      paper_bgcolor: '#E4E4E4', // Color of the entire plotting area
      font: {
        size: 4,
      },
      margin: {
        t: 25, //top margin
        l: 25, //left margin
        r: 20, //right margin
        b: 25, //bottom margin
      },
    };

    let config = {
      modeBarButtonsToRemove: ['zoom2d', 'select2d', 'lasso2d', 'resetScale2d'],
      responsive: true,
      displaylogo: false,
      toImageButtonOptions: {
        filename: taskRecord.fileName
          ? taskRecord.fileName + '_radarPlot'
          : 'radarPlot',
      },
    };

    setPlotlyData(data);
    setPlotlyLayout(layout);
    setPlotlyConfig(config);
  }, []);

  const handlePlotClick = () => {
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  const showTable = () => {
    setTableView(!tableView);
  };

  const downloadCSV = () => {
    const data = Object.entries(taskRecord.radarTable);

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Adding header row
    csvContent += 'Attribute,Value\r\n';

    // Adding data rows
    data.forEach(([key, value]) => {
      csvContent += `${key},${value}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const file_name = taskRecord.fileName ? taskRecord.fileName : '';
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', file_name + '_' + taskName + '.csv');
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "radarTableData.csv".
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex p-4">
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-md ${tableView ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={showTable}
        >
          Table
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-md ${!tableView ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={showTable}
        >
          Scatter Plot
        </button>
      </div>
      {!tableView && (
        <Plot data={plotlyData} config={plotlyConfig} layout={{}} />
      )}

{tableView && (
  <div className="p-4">
    <div className="overflow-x-auto rounded-lg shadow-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attribute
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(taskRecord.radarTable).map(([key, value]) => (
            <tr key={key}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {key}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {typeof value === 'number' ? value.toFixed(4) : value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex justify-center">
  <Button
    variant="contained"
    onClick={downloadCSV}
    startIcon={<CloudDownload />}
    sx={{
      bgcolor: 'primary.main',
      '&:hover': { bgcolor: 'primary.dark' },
      textTransform: 'none',
      fontWeight: 'bold',
      px: 3,
      py: 1,
    }}
  >
    Download CSV
  </Button>
</div>
  </div>
)}
    </div>
  );
};

export default ScatterPlot;
