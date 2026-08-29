// const currentMonth = new Date().toLocaleString('default', { month: 'short' });
const currentMonth = new Date().toLocaleString('default', { month: 'short' });

////console.log('Current month:', currentMonth);

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Find the index of the current month
const currentMonthIndex = months.indexOf(currentMonth);

// Generate updated categories array
const updatedCategories = [
  ...months.slice(currentMonthIndex + 1),
  ...months.slice(0, currentMonthIndex + 1)
];

//console.log('Updated categories:', updatedCategories);

const lineChart = {
  series: [
    {
      name: "Total Sell Amount",
      data: [350, 40, 300, 220, 500, 250, 400, 230, 500, 250, 400, 230],
      offsetY: 0,
    },
    {
      name: "Total Buy Amount",
      data: [30, 90, 40, 140, 290, 290, 340, 230, 400, 200, 300, 130],
      offsetY: 0,
    },
  ],

  options: {
    chart: {
      width: "100%",
      height: 350,
      type: "area",
      toolbar: {
        show: false,
      },
    },

    legend: {
      show: false,
    },

    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
    },

    yaxis: {
      labels: {
        style: {
          fontSize: "14px",
          fontWeight: 600,
          colors: ["#8c8c8c"],
        },
      },
    },

    xaxis: {
      labels: {
        style: {
          fontSize: "14px",
          fontWeight: 600,
          colors: ["##b69100", "#8c8c8c", "#8c8c8c", "#8c8c8c","#8c8c8c","#8c8c8c","#8c8c8c","#8c8c8c","#8c8c8c","#8c8c8c","#8c8c8c","#8c8c8c"],
        },
      },
      categories: updatedCategories,
    },

    tooltip: {
      y: {
        formatter: function (val) {
          return "Rs " + val + ".00";
        },
      },
    },
  },
};

export default lineChart;
