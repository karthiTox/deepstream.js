const socket = io.connect("http://localhost:4000");

let chartColors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
};

let ctx = document.getElementById('loss').getContext('2d');
let ctx1 = document.getElementById('loss2').getContext('2d');
let MB = [];
let time = [];
let myChart = new Chart(ctx,  {
    type: 'line',
    data: {
        labels: time,
        datasets: [{
            label: "MB",
            backgroundColor: chartColors.red,
            borderColor: chartColors.red,
            data: MB,
            fill: false,
        }]
    },
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Memory usage'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'MB'
                }
            }]
        }
    }
})

let myChart1 = new Chart(ctx1,  {
    type: 'line',
    data: {
        labels: time,
        datasets: [{
            label: "MB",
            backgroundColor: chartColors.red,
            borderColor: chartColors.red,
            data: MB,
            fill: false,
        }]
    },
    options: {
        responsive: true,
        title: {
            display: true,
            text: 'Memory usage'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'MB'
                }
            }]
        }
    }
})

socket.on("loss", (mes)=>{
    console.log(mes)
    time.push(mes.time);
    MB.push(mes.MB);
    myChart.update();
    myChart1.update();
})