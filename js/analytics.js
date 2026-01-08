// js/analytics.js
// Analytics system to track user behavior and diagnoses

const Analytics = {
    // Get or initialize analytics data
    getAnalytics() {
        return JSON.parse(localStorage.getItem('healbuddyAnalytics')) || {
            sessions: [],
            symptomTrends: {},
            diagnosisTrends: {},
            userStats: {}
        };
    },

    // Save analytics data
    saveAnalytics(data) {
        localStorage.setItem('healbuddyAnalytics', JSON.stringify(data));
    },

    // Record a user session/query
    recordQuery(userEmail, selectedSymptomIds, topDiagnosis) {
        const analytics = this.getAnalytics();
        const timestamp = new Date().toISOString();

        // Create session entry
        const sessionEntry = {
            userEmail: userEmail,
            timestamp: timestamp,
            symptomsSelected: selectedSymptomIds.length,
            symptoms: selectedSymptomIds,
            topDiagnosis: topDiagnosis?.disease_name || 'None',
            topDiagnosisId: topDiagnosis?.disease_id || null,
            topDiagnosisScore: topDiagnosis?.score || 0
        };

        analytics.sessions.push(sessionEntry);

        // Update symptom trends
        selectedSymptomIds.forEach(symptomsId => {
            analytics.symptomTrends[symptomsId] = (analytics.symptomTrends[symptomsId] || 0) + 1;
        });

        // Update diagnosis trends
        if (topDiagnosis) {
            const diagName = topDiagnosis.disease_name;
            analytics.diagnosisTrends[diagName] = (analytics.diagnosisTrends[diagName] || 0) + 1;
        }

        // Update user stats
        if (!analytics.userStats[userEmail]) {
            analytics.userStats[userEmail] = {
                firstLogin: timestamp,
                lastActive: timestamp,
                queriesCount: 0,
                lastQuery: null
            };
        }

        analytics.userStats[userEmail].lastActive = timestamp;
        analytics.userStats[userEmail].queriesCount += 1;
        analytics.userStats[userEmail].lastQuery = sessionEntry;

        // Keep only last 1000 sessions to prevent localStorage overflow
        if (analytics.sessions.length > 1000) {
            analytics.sessions = analytics.sessions.slice(-1000);
        }

        this.saveAnalytics(analytics);
    },

    // Get summary statistics
    getSummary() {
        const analytics = this.getAnalytics();
        const now = new Date().getTime();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

        const last7Days = analytics.sessions.filter(s => 
            new Date(s.timestamp).getTime() > oneWeekAgo
        ).length;

        const last30Days = analytics.sessions.filter(s => 
            new Date(s.timestamp).getTime() > oneMonthAgo
        ).length;

        return {
            totalSessions: analytics.sessions.length,
            totalUsers: Object.keys(analytics.userStats).length,
            last7Days: last7Days,
            last30Days: last30Days,
            topSymptoms: this.getTopItems(analytics.symptomTrends, 10),
            topDiagnoses: this.getTopItems(analytics.diagnosisTrends, 10),
            userRetention: this.calculateRetention(analytics)
        };
    },

    // Get top items from a frequency map
    getTopItems(items, limit = 10) {
        return Object.entries(items)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    },

    // Calculate user retention rate (% of users with multiple sessions)
    calculateRetention(analytics) {
        const userStats = analytics.userStats;
        const usersWithMultipleSessions = Object.values(userStats).filter(u => u.queriesCount > 1).length;
        const totalUsers = Object.keys(userStats).length;
        return totalUsers > 0 ? Math.round((usersWithMultipleSessions / totalUsers) * 100) : 0;
    },

    // Get detailed data for admin dashboard
    getDetailedStats() {
        const analytics = this.getAnalytics();
        return {
            totalSessions: analytics.sessions.length,
            totalUniqueUsers: Object.keys(analytics.userStats).length,
            totalQueries: analytics.sessions.reduce((sum, s) => sum + 1, 0),
            averageSymptomsPerQuery: analytics.sessions.length > 0
                ? (analytics.sessions.reduce((sum, s) => sum + s.symptomsSelected, 0) / analytics.sessions.length).toFixed(1)
                : 0,
            symptoms: analytics.symptomTrends,
            diagnoses: analytics.diagnosisTrends,
            recentSessions: analytics.sessions.slice(-50),
            users: analytics.userStats
        };
    },


};