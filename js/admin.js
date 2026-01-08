// js/admin.js - Admin dashboard logic with charts

let symptomsChart, diagnosesChart, activityChart;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupCharts();
    setInterval(loadDashboardData, 30000); // Auto-refresh every 30 seconds
});

function loadDashboardData() {
    const summary = Analytics.getSummary();
    const detailed = Analytics.getDetailedStats();

    document.getElementById('totalSessions').textContent = summary.totalSessions;
    document.getElementById('totalUsers').textContent = summary.totalUsers;
    document.getElementById('last7Days').textContent = summary.last7Days;
    document.getElementById('retentionRate').textContent = summary.userRetention + '%';

    updateChartsData(summary, detailed);
    populateRecentSessions(detailed.recentSessions);
    populateUserStats(detailed.users);
}

function setupCharts() {
    const ctx1 = document.getElementById('symptomsChart')?.getContext('2d');
    const ctx2 = document.getElementById('diagnosesChart')?.getContext('2d');
    const ctx3 = document.getElementById('activityChart')?.getContext('2d');

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true
    };

    if (ctx1) {
        symptomsChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Times Selected',
                    data: [],
                    backgroundColor: ['#FF6B9D', '#FF8AAD', '#FFB5C5', '#FF4081', '#E91E63', '#EC407A', '#EF5350', '#F57C00', '#FF8C42', '#FFA726'],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                ...chartOptions,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#666' }, grid: { color: '#E0E0E0' } },
                    x: { ticks: { color: '#666' }, grid: { display: false } }
                }
            }
        });
    }

    if (ctx2) {
        diagnosesChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#FF6B9D', '#4ECDC4', '#FFE66D', '#FF8C42', '#667eea', '#764ba2', '#F44336', '#9C27B0', '#00BCD4', '#4CAF50'],
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                ...chartOptions,
                plugins: { legend: { position: 'bottom', labels: { color: '#333', padding: 15, font: { size: 12, weight: 'bold' } } } }
            }
        });
    }

    if (ctx3) {
        activityChart = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sessions',
                    data: [],
                    borderColor: '#FF6B9D',
                    backgroundColor: 'rgba(255, 107, 157, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FF6B9D',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                ...chartOptions,
                plugins: { legend: { display: true, labels: { color: '#333', font: { size: 12, weight: 'bold' } } } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#666' }, grid: { color: '#E0E0E0' } },
                    x: { ticks: { color: '#666' }, grid: { color: '#E0E0E0' } }
                }
            }
        });
    }
}

function updateChartsData(summary, detailed) {
    if (symptomsChart?.data && summary.topSymptoms.length > 0) {
        symptomsChart.data.labels = summary.topSymptoms.map(s => {
            const symptom = symptomsData.find(sd => sd.symptom_id === parseInt(s.name));
            return symptom ? symptom.symptom_name.substring(0, 15) : 'Unknown';
        });
        symptomsChart.data.datasets[0].data = summary.topSymptoms.map(s => s.count);
        symptomsChart.update();
    }

    if (diagnosesChart?.data && summary.topDiagnoses.length > 0) {
        diagnosesChart.data.labels = summary.topDiagnoses.map(d => d.name);
        diagnosesChart.data.datasets[0].data = summary.topDiagnoses.map(d => d.count);
        diagnosesChart.update();
    }

    if (activityChart?.data && detailed.recentSessions.length > 0) {
        const dailyData = {};
        detailed.recentSessions.forEach(session => {
            const date = new Date(session.timestamp).toLocaleDateString();
            dailyData[date] = (dailyData[date] || 0) + 1;
        });
        const dates = Object.keys(dailyData).sort();
        activityChart.data.labels = dates;
        activityChart.data.datasets[0].data = dates.map(d => dailyData[d]);
        activityChart.update();
    }
}

function populateRecentSessions(sessions) {
    const tableBody = document.getElementById('recentSessionsTable');
    if (!sessions.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">No session data available</td></tr>';
        return;
    }
    tableBody.innerHTML = sessions.slice(-20).reverse().map(s => `
        <tr>
            <td class="email-cell">${s.userEmail.substring(0, 20)}${s.userEmail.length > 20 ? '...' : ''}</td>
            <td>${new Date(s.timestamp).toLocaleString()}</td>
            <td><strong>${s.symptomsSelected}</strong></td>
            <td>${s.topDiagnosis}</td>
            <td><strong>${s.topDiagnosisScore.toFixed(1)}%</strong></td>
        </tr>
    `).join('');
}

function populateUserStats(userStats) {
    const tableBody = document.getElementById('userStatsTable');
    const users = Object.entries(userStats).map(([email, stats]) => ({ email, ...stats }));
    
    if (!users.length) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">No user data available</td></tr>';
        return;
    }
    
    tableBody.innerHTML = users.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
        .slice(0, 20).map(u => `
        <tr>
            <td class="email-cell">${u.email}</td>
            <td>${new Date(u.firstLogin).toLocaleDateString()}</td>
            <td>${new Date(u.lastActive).toLocaleString()}</td>
            <td><strong>${u.queriesCount}</strong></td>
        </tr>
    `).join('');
}

function goBackToApp() {
    window.location.href = 'index.html';
} 