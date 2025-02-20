// src/pages/TaskDetails/ScatterPlot.jsx
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const ScatterPlot = ({ taskRecord, taskName }) => {
  const [plotlyData, setPlotlyData] = useState([]);
  const [plotlyLayout, setPlotlyLayout] = useState({});
  const [plotlyConfig, setPlotlyConfig] = useState({});
  const [tableView, setTableView] = useState(true);

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  useEffect(() => {
    console.log(taskName);
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
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <table
              style={{
                borderCollapse: 'collapse',
                border: '1px solid black',
                margin: 'auto',
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '8px' }}>
                    Attribute
                  </th>
                  <th style={{ border: '1px solid black', padding: '8px' }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(taskRecord.radarTable).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ border: '1px solid black', padding: '8px' }}>
                      {key}
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            style={{
              marginTop: '18px',
              marginBottom: '25px',
              position: 'relative',
              backgroundColor: '#41337A', // Background color
              color: 'white', // Text color
              border: 'none', // Removes the default border
              borderRadius: '5px', // Rounded corners
              padding: '10px 20px', // Padding inside the button
              cursor: 'pointer', // Cursor changes to pointer on hover
            }}
            onClick={downloadCSV}
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default ScatterPlot;
