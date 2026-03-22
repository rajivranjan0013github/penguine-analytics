import mongoose from 'mongoose';

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// Helper to get date string in YYYY-MM-DD format (IST)
const getDateString = (date) => {
    const istDate = new Date(date.getTime() + IST_OFFSET);
    return istDate.toISOString().split('T')[0];
};

// Helper to get start date based on days parameter
const getStartDate = (days) => {
    const now = new Date();
    const istNow = new Date(now.getTime() + IST_OFFSET);
    istNow.setUTCHours(0, 0, 0, 0);
    istNow.setUTCDate(istNow.getUTCDate() - days);
    return new Date(istNow.getTime() - IST_OFFSET);
};

// Fill in missing dates for trend data
const fillMissingDates = (data, days) => {
    const result = [];
    const dataMap = new Map(data.map(d => [d._id, d.count]));

    const now = new Date();
    // Create a date object in IST
    const istNow = new Date(now.getTime() + IST_OFFSET);

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(istNow.getTime());
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        result.push({
            date: dateStr,
            count: dataMap.get(dateStr) || 0
        });
    }
    return result;
};

// Native collection access to avoid model overhead
const getCollections = () => {
    const db = mongoose.connection.db;
    return {
        users: db.collection('users'), 
        couples: db.collection('couples'),
        answers: db.collection('answers'),
        tictactoes: db.collection('tictactoes'),
        wordles: db.collection('wordles'),
        jigsawpuzzles: db.collection('jigsawpuzzles')
    };
};

export const getSummary = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = getStartDate(days);
        const { users, couples, answers, tictactoes, wordles, jigsawpuzzles } = getCollections();

        const [
            totalUsers,
            activeCouples,
            totalAnswers,
            genderCounts,
            userTrendData,
            coupleTrendData,
            answerTrendData,
            gameStats
        ] = await Promise.all([
            // Core Metrics
            users.countDocuments(),
            couples.countDocuments({ status: 'active' }),
            answers.countDocuments(),

            // Demographics
            users.aggregate([
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ]).toArray(),

            // User Growth Trend
            users.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).toArray(),

            // Couple Connectivity Trend
            couples.aggregate([
                { $match: { connectionDate: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$connectionDate', timezone: '+05:30' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).toArray(),

            // Engagement Trend (Answers)
            answers.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).toArray(),

            // Game Popularity
            Promise.all([
                tictactoes.countDocuments(),
                wordles.countDocuments(),
                jigsawpuzzles.countDocuments()
            ])
        ]);

        const userTrend = fillMissingDates(userTrendData, days);
        const coupleTrend = fillMissingDates(coupleTrendData, days);
        const answerTrend = fillMissingDates(answerTrendData, days);

        const genderSplit = [
            { name: 'Male', value: genderCounts.find(g => g._id === 'male')?.count || 0 },
            { name: 'Female', value: genderCounts.find(g => g._id === 'female')?.count || 0 },
            { name: 'Other', value: genderCounts.find(g => g._id === 'other')?.count || 0 },
        ];

        const gameSplit = [
            { name: 'TicTacToe', value: gameStats[0] },
            { name: 'Wordle', value: gameStats[1] },
            { name: 'Puzzles', value: gameStats[2] },
        ];

        res.json({
            metrics: {
                totalUsers,
                activeCouples,
                totalAnswers,
                totalGames: gameStats.reduce((a, b) => a + b, 0)
            },
            trends: {
                userTrend,
                coupleTrend,
                answerTrend
            },
            splits: {
                genderSplit,
                gameSplit
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Failed to aggregate analytics' });
    }
};
