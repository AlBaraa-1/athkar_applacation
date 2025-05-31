// statistics.js - Handles statistics and chart logic for the main dashboard

/**
 * Show loading skeletons for statistics section.
 */
function showStatisticsLoading() {
    document.getElementById('stat-total-tasbeeh').innerHTML = '<span class="skeleton-loading rounded w-12 h-8 inline-block"></span>';
    document.getElementById('stat-favorites').innerHTML = '<span class="skeleton-loading rounded w-12 h-8 inline-block"></span>';
    document.getElementById('stat-prayer-consistency').innerHTML = '<span class="skeleton-loading rounded w-12 h-8 inline-block"></span>';
    var ctx = document.getElementById('tasbeeh-chart');
    if (ctx) {
        var chartCtx = ctx.getContext ? ctx.getContext('2d') : null;
        if (chartCtx) {
            chartCtx.clearRect(0, 0, ctx.width, ctx.height);
            chartCtx.font = '16px Tajawal, sans-serif';
            chartCtx.fillStyle = '#e0c97f';
            chartCtx.textAlign = 'center';
            chartCtx.fillText('...', ctx.width/2, ctx.height/2);
        }
    }
}

/**
 * Show error state for statistics section.
 */
function showStatisticsError() {
    document.getElementById('stat-total-tasbeeh').textContent = '--';
    document.getElementById('stat-favorites').textContent = '--';
    document.getElementById('stat-prayer-consistency').textContent = '--';
    var ctx = document.getElementById('tasbeeh-chart');
    if (ctx) {
        var chartCtx = ctx.getContext ? ctx.getContext('2d') : null;
        if (chartCtx) {
            chartCtx.clearRect(0, 0, ctx.width, ctx.height);
            chartCtx.font = '14px Tajawal, sans-serif';
            chartCtx.fillStyle = '#e57373';
            chartCtx.textAlign = 'center';
            chartCtx.fillText('لا توجد بيانات', ctx.width/2, ctx.height/2);
        }
    }
}

/**
 * Populate statistics section with data.
 * @param {Object} stats - Statistics data object
 */
function populateStatistics(stats) {
    document.getElementById('stat-total-tasbeeh').textContent = stats.totalTasbeeh ?? '0';
    document.getElementById('stat-favorites').textContent = stats.favorites ?? '0';
    document.getElementById('stat-prayer-consistency').textContent =
        stats.prayerConsistency !== undefined && stats.prayerConsistency !== null ? stats.prayerConsistency + '%' : '0%';
    // Tasbeeh Distribution Chart
    var ctx = document.getElementById('tasbeeh-chart');
    if (ctx && stats.tasbeehDistribution && Object.keys(stats.tasbeehDistribution).length > 0) {
        var chartCtx = ctx.getContext ? ctx.getContext('2d') : null;
        if (!chartCtx) return;
        if (window.tasbeehChart) window.tasbeehChart.destroy();
        window.tasbeehChart = new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(stats.tasbeehDistribution),
                datasets: [{
                    data: Object.values(stats.tasbeehDistribution),
                    backgroundColor: ['#e0c97f', '#a67c2e', '#7c5c1e', '#f6eec7', '#ffe9a7', '#bfa76a', '#e6d8b2'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    legend: { display: true, position: 'bottom', labels: { font: { family: 'Tajawal, sans-serif', size: 12 }, color: '#a67c2e', boxWidth: 14 } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var label = context.label || '';
                                var value = context.parsed;
                                return label + ': ' + value;
                            }
                        }
                    }
                },
                cutout: '70%',
                responsive: false,
                maintainAspectRatio: false
            }
        });
    } else if (ctx) {
        var chartCtx = ctx.getContext ? ctx.getContext('2d') : null;
        if (chartCtx) {
            chartCtx.clearRect(0, 0, ctx.width, ctx.height);
            chartCtx.font = '14px Tajawal, sans-serif';
            chartCtx.fillStyle = '#a67c2e';
            chartCtx.textAlign = 'center';
            chartCtx.fillText('لا توجد بيانات', ctx.width/2, ctx.height/2);
        }
    }
}

/**
 * Fetch and display statistics (from backend or fallback).
 * Handles loading and error states.
 */
async function fetchAndShowStatistics() {
    showStatisticsLoading();
    try {
        let stats = null;
        if (window.getUserStatistics) {
            stats = await window.getUserStatistics();
        }
        if (!stats) {
            // fallback example
            stats = {
                totalTasbeeh: 1234,
                favorites: 5,
                prayerConsistency: 92,
                tasbeehDistribution: {"سبحان الله": 400, "الحمد لله": 500, "الله أكبر": 334}
            };
        }
        populateStatistics(stats);
    } catch (e) {
        showStatisticsError();
    }
}

document.addEventListener('DOMContentLoaded', fetchAndShowStatistics);
document.getElementById('chart-period').addEventListener('change', async function() {
    showStatisticsLoading();
    let period = this.value;
    let stats = null;
    if (window.getUserStatistics) {
        stats = await window.getUserStatistics(period);
    }
    if (!stats) {
        // fallback example for demo
        if (period === 'week') {
            stats = {
                totalTasbeeh: 234,
                favorites: 5,
                prayerConsistency: 90,
                tasbeehDistribution: {"سبحان الله": 80, "الحمد لله": 90, "الله أكبر": 64}
            };
        } else if (period === 'month') {
            stats = {
                totalTasbeeh: 1200,
                favorites: 5,
                prayerConsistency: 92,
                tasbeehDistribution: {"سبحان الله": 400, "الحمد لله": 500, "الله أكبر": 300}
            };
        } else {
            stats = {
                totalTasbeeh: 5000,
                favorites: 5,
                prayerConsistency: 95,
                tasbeehDistribution: {"سبحان الله": 1800, "الحمد لله": 2000, "الله أكبر": 1200}
            };
        }
    }
    populateStatistics(stats);
});
