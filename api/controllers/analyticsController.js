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
    const dataMap = new Map(data.map(d => [d._id, d]));

    const now = new Date();
    // Create a date object in IST
    const istNow = new Date(now.getTime() + IST_OFFSET);

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(istNow.getTime());
        date.setUTCDate(date.getUTCDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const existingData = dataMap.get(dateStr) || {};
        result.push({
            date: dateStr,
            count: existingData.count || 0,
            uniqueCouples: existingData.uniqueCouples || 0
        });
    }
    return result;
};

const getCollections = () => {
    const db = mongoose.connection.db;
    return {
        users: db.collection('users'), 
        couples: db.collection('couples'),
        answers: db.collection('answers'),
        tictactoes: db.collection('tictactoes'),
        wordles: db.collection('wordles'),
        jigsawpuzzles: db.collection('jigsawpuzzles'),
        chats: db.collection('chats'),
        dailyanswers: db.collection('dailyanswers')
    };
};

export const getSummary = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = getStartDate(days);
        const { users, couples } = getCollections();
        const db = mongoose.connection.db;

        const [
            totalUsers,
            activeCouples,
            genderCounts,
            platformCounts,
            connectivityCounts,
            userTrendData,
            coupleTrendData,
            engagementCounts,
            engagementTrendResults
        ] = await Promise.all([
            // Core Metrics
            users.countDocuments(),
            couples.countDocuments({ status: 'active' }),
            
            // Demographics
            users.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]).toArray(),
            users.aggregate([{ $group: { _id: '$platform', count: { $sum: 1 } } }]).toArray(),
            users.aggregate([{ $group: { _id: { $cond: [{ $ifNull: ['$partnerId', false] }, 'connected', 'unpaired'] }, count: { $sum: 1 } } }]).toArray(),

            // Trends
            users.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray(),

            couples.aggregate([
                { $match: { connectionDate: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$connectionDate', timezone: '+05:30' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray(),

            // Total Engagement Counts [Chats, TicTacToe, Wordle, Jigsaw, Daily]
            Promise.all([
                db.collection('chats').countDocuments(),
                db.collection('tictactoes').countDocuments(),
                db.collection('wordles').countDocuments(),
                db.collection('jigsawpuzzles').countDocuments(),
                db.collection('dailyanswers').countDocuments()
            ]),

            // Engagement Trends from multiple collections
            Promise.all([
                db.collection('chats').aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 }, couples: { $addToSet: '$coupleId' } } }]).toArray(),
                db.collection('tictactoes').aggregate([
                    { $match: { createdAt: { $gte: startDate } } }, 
                    { $addFields: { 
                        cid: { $cond: [ { $lt: [ { $toString: "$creatorId" }, { $toString: "$partnerId" } ] }, { $concat: [ { $toString: "$creatorId" }, "_", { $toString: "$partnerId" } ] }, { $concat: [ { $toString: "$partnerId" }, "_", { $toString: "$creatorId" } ] } ] }
                    }},
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 }, couples: { $addToSet: '$cid' } } }
                ]).toArray(),
                db.collection('wordles').aggregate([
                    { $match: { createdAt: { $gte: startDate } } }, 
                    { $addFields: { 
                        cid: { $cond: [ { $lt: [ { $toString: "$creatorId" }, { $toString: "$partnerId" } ] }, { $concat: [ { $toString: "$creatorId" }, "_", { $toString: "$partnerId" } ] }, { $concat: [ { $toString: "$partnerId" }, "_", { $toString: "$creatorId" } ] } ] }
                    }},
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 }, couples: { $addToSet: '$cid' } } }
                ]).toArray(),
                db.collection('jigsawpuzzles').aggregate([
                    { $match: { createdAt: { $gte: startDate } } }, 
                    { $addFields: { 
                        cid: { $cond: [ { $lt: [ { $toString: "$creatorId" }, { $toString: "$partnerId" } ] }, { $concat: [ { $toString: "$creatorId" }, "_", { $toString: "$partnerId" } ] }, { $concat: [ { $toString: "$partnerId" }, "_", { $toString: "$creatorId" } ] } ] }
                    }},
                    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 }, couples: { $addToSet: '$cid' } } }
                ]).toArray(),
                db.collection('dailyanswers').aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } }, count: { $sum: 1 }, couples: { $addToSet: '$coupleId' } } }]).toArray()
            ])
        ]);

        // Merge engagement trends and unique couples
        const mergedEngagementTrendMap = new Map();
        const dailyUniqueCouplesMap = new Map();

        engagementTrendResults.flat().forEach(entry => {
            // Stats
            const currentCount = mergedEngagementTrendMap.get(entry._id) || 0;
            mergedEngagementTrendMap.set(entry._id, currentCount + entry.count);

            // Couples
            if (!dailyUniqueCouplesMap.has(entry._id)) {
                dailyUniqueCouplesMap.set(entry._id, new Set());
            }
            const set = dailyUniqueCouplesMap.get(entry._id);
            entry.couples?.forEach(cid => {
                if (cid) set.add(cid.toString());
            });
        });

        const engagementTrendData = Array.from(mergedEngagementTrendMap.entries())
            .map(([_id, count]) => ({ 
                _id, 
                count,
                uniqueCouples: dailyUniqueCouplesMap.get(_id)?.size || 0 
            }))
            .sort((a, b) => a._id.localeCompare(b._id));

        const todayStart = getStartDate(0);

        const [todayEngagementCounts] = await Promise.all([
            Promise.all([
                db.collection('chats').countDocuments({ createdAt: { $gte: todayStart } }),
                db.collection('tictactoes').countDocuments({ createdAt: { $gte: todayStart } }),
                db.collection('wordles').countDocuments({ createdAt: { $gte: todayStart } }),
                db.collection('jigsawpuzzles').countDocuments({ createdAt: { $gte: todayStart } }),
                db.collection('dailyanswers').countDocuments({ createdAt: { $gte: todayStart } })
            ])
        ]);

        const userTrend = fillMissingDates(userTrendData, days);
        const coupleTrend = fillMissingDates(coupleTrendData, days);
        const engagementTrend = fillMissingDates(engagementTrendData, days);
        
        // Individual Game Trends with Unique Couples
        const ttTrend = fillMissingDates(engagementTrendResults[1].map(d => ({ ...d, uniqueCouples: d.couples?.length || 0 })), days);
        const wdTrend = fillMissingDates(engagementTrendResults[2].map(d => ({ ...d, uniqueCouples: d.couples?.length || 0 })), days);
        const jsTrend = fillMissingDates(engagementTrendResults[3].map(d => ({ ...d, uniqueCouples: d.couples?.length || 0 })), days);

        res.json({
            metrics: {
                totalUsers,
                activeCouples,
                todayEngagements: todayEngagementCounts.reduce((a, b) => a + b, 0),
                todayGames: todayEngagementCounts[1] + todayEngagementCounts[2] + todayEngagementCounts[3]
            },
            trends: {
                userTrend,
                coupleTrend,
                engagementTrend,
                gameTrends: {
                    tictactoe: ttTrend,
                    wordle: wdTrend,
                    jigsaw: jsTrend
                }
            },
            splits: {
                genderSplit: [
                    { name: 'Male', value: genderCounts.find(g => g._id === 'male')?.count || 0 },
                    { name: 'Female', value: genderCounts.find(g => g._id === 'female')?.count || 0 },
                    { name: 'Other', value: genderCounts.find(g => g._id === 'other')?.count || 0 },
                ],
                gameSplit: [
                    { name: 'TicTacToe', value: engagementCounts[1] },
                    { name: 'Wordle', value: engagementCounts[2] },
                    { name: 'Puzzles', value: engagementCounts[3] },
                ],
                platformSplit: [
                    { name: 'iOS', value: platformCounts.find(p => p._id === 'ios')?.count || 0 },
                    { name: 'Android', value: platformCounts.find(p => p._id === 'android')?.count || 0 },
                ],
                connectivitySplit: [
                    { name: 'Connected', value: connectivityCounts.find(c => c._id === 'connected')?.count || 0 },
                    { name: 'Unpaired', value: connectivityCounts.find(c => c._id === 'unpaired')?.count || 0 },
                ]
            }
        });
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Failed to aggregate analytics' });
    }
};
