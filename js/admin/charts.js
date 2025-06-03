// Chart instances
let revenueChart = null;
let gamesChart = null;

// Helper function to get last seven days
function getLastSevenDays() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
}

// Initialize revenue chart
export function initializeRevenueChart() {
    // Destroy existing chart if it exists
    if (revenueChart) {
        revenueChart.destroy();
    }

    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    revenueChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: getLastSevenDays(),
            datasets: [{
                label: 'Revenue',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#00ff9d',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 255, 157, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e1e1e1'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e1e1e1'
                    }
                }
            }
        }
    });
}

// Initialize games chart
export function initializeGamesChart() {
    // Destroy existing chart if it exists
    if (gamesChart) {
        gamesChart.destroy();
    }

    const ctx = document.getElementById('gamesChart');
    if (!ctx) return;

    gamesChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#00ff9d',
                    '#00c3ff',
                    '#ff00ff',
                    '#ffa502',
                    '#ff4757'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e1e1e1'
                    }
                }
            }
        }
    });
}
