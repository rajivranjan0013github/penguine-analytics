import mongoose from 'mongoose';
import { getCountryInfo } from '../../countryMapper.js';

const REPORT_TIMEZONE = '+05:30';
const DAY_MS = 24 * 60 * 60 * 1000;
const SUMMARY_CACHE_TTL_MS = 60 * 1000;
const summaryCache = new Map();

const clampDays = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed === 0) return 28;
    return Math.min(Math.max(parsed, 1), 365);
};

const startOfReportDay = (daysAgo = 0) => {
    const now = new Date();
    const reportNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    reportNow.setUTCHours(0, 0, 0, 0);
    reportNow.setUTCDate(reportNow.getUTCDate() - daysAgo);
    return new Date(reportNow.getTime() - (5.5 * 60 * 60 * 1000));
};

const dateKey = (date) => (
    new Date(date.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 10)
);

const fillMissingDates = (data, days) => {
    const byDate = new Map(data.map((entry) => [entry._id, entry]));
    const result = [];
    const today = startOfReportDay(0);

    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const day = new Date(today.getTime() - (offset * DAY_MS));
        const key = dateKey(day);
        result.push({
            date: key,
            count: byDate.get(key)?.count || 0,
            uniqueCouples: byDate.get(key)?.uniqueCouples || 0,
        });
    }

    return result;
};

const mergeDailySeries = (seriesList, days) => {
    const merged = new Map();

    seriesList.flat().forEach((entry) => {
        const current = merged.get(entry._id) || { count: 0, couples: new Set() };
        current.count += entry.count || 0;
        (entry.couples || []).forEach((coupleId) => {
            if (coupleId) current.couples.add(coupleId.toString());
        });
        merged.set(entry._id, current);
    });

    return fillMissingDates(
        Array.from(merged.entries()).map(([_id, value]) => ({
            _id,
            count: value.count,
            uniqueCouples: value.couples.size,
        })),
        days,
    );
};

const dailyActivityPipeline = ({ startDate, dateField, coupleField, match = {}, countExpression }) => {
    const group = {
        _id: {
            $dateToString: {
                format: '%Y-%m-%d',
                date: dateField,
                timezone: REPORT_TIMEZONE,
            },
        },
        count: countExpression || { $sum: 1 },
    };

    if (coupleField) group.couples = { $addToSet: coupleField };

    return [
        { $match: { ...match, [dateField.slice(1)]: { $gte: startDate } } },
        { $group: group },
        { $sort: { _id: 1 } },
    ];
};

const percentage = (numerator, denominator) => (
    denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
);

const groupTimezonesByCountry = (timezoneCounts) => {
    const countries = new Map();

    timezoneCounts.forEach((item) => {
        const timezone = item._id || 'unknown';
        const info = getCountryInfo(timezone);
        const key = info.code || info.country || 'unknown';
        const current = countries.get(key) || {
            code: info.code,
            name: info.country || 'Unknown country',
            flag: info.flag,
            value: 0,
            premiumUsers: 0,
            iosUsers: 0,
            androidUsers: 0,
            timezones: new Set(),
        };

        current.value += item.count || 0;
        current.premiumUsers += item.premiumCount || 0;
        current.iosUsers += item.iosCount || 0;
        current.androidUsers += item.androidCount || 0;
        if (timezone !== 'unknown') current.timezones.add(timezone);
        countries.set(key, current);
    });

    return Array.from(countries.values())
        .map((item) => ({
            code: item.code,
            name: item.name,
            flag: item.flag,
            value: item.value,
            premiumUsers: item.premiumUsers,
            iosUsers: item.iosUsers,
            androidUsers: item.androidUsers,
            conversionRate: item.value > 0 ? Math.round((item.premiumUsers / item.value) * 1000) / 10 : 0,
            timezoneCount: item.timezones.size,
        }))
        .sort((first, second) => second.value - first.value || first.name.localeCompare(second.name));
};

export const getSummary = async (req, res) => {
    try {
        const days = clampDays(req.query.days);
        const cached = summaryCache.get(days);
        if (cached?.expiresAt > Date.now()) {
            res.set('Cache-Control', 'private, no-store');
            res.set('X-Analytics-Cache', 'HIT');
            return res.json(cached.payload);
        }

        summaryCache.delete(days);
        const startDate = startOfReportDay(days - 1);
        const todayStart = startOfReportDay(0);
        const weekStart = new Date(todayStart.getTime() - (6 * DAY_MS));
        const monthStart = new Date(todayStart.getTime() - (29 * DAY_MS));
        const db = mongoose.connection.db;

        const users = db.collection('users');
        const couples = db.collection('couples');
        const chats = db.collection('chats');
        const chatMessagesV2 = db.collection('questionchatmessagev2');
        const questionAnswersV2 = db.collection('questionanswerv2');
        const questionProgressV2 = db.collection('questionprogressv2');
        const dailyAnswers = db.collection('dailyanswers');
        const ritualStatuses = db.collection('coupledailyritualstatuses');
        const streaks = db.collection('couplestreaks');
        const tictactoes = db.collection('tictactoes');
        const wordles = db.collection('wordles');
        const puzzles = db.collection('jigsawpuzzles');
        const wordSearchGames = db.collection('wordsearchgames');
        const moodLogs = db.collection('moodlogs');
        const memories = db.collection('memories');
        const subscriptions = db.collection('subscriptions');
        const callDiagnostics = db.collection('calldiagnostics');

        const [
            totalUsers,
            activeCouples,
            unpairedCouples,
            premiumUsers,
            rangePremiumUsers,
            dau,
            wau,
            mau,
            genderCounts,
            platformCounts,
            languageCounts,
            timezoneCounts,
            versionCounts,
            onboardingCounts,
            userTrendData,
            coupleTrendData,
            unpairTrendData,
            legacyChatActivity,
            v2MessageActivity,
            v2AnswerActivity,
            dailyAnswerActivity,
            moodActivity,
            memoryActivity,
            scribbleActivity,
            tictactoeActivity,
            wordleActivity,
            puzzleActivity,
            wordSearchActivity,
            ritualTrendData,
            ritualStateCounts,
            streakSummary,
            questionProgressSummary,
            topicCounts,
            formatCounts,
            subscriptionCounts,
            widgetSummary,
            locationSummary,
            featureCounts,
            todayGameActivity,
            callAnalytics,
        ] = await Promise.all([
            users.countDocuments(),
            couples.countDocuments({ status: 'active' }),
            couples.countDocuments({ status: 'unpaired' }),
            users.countDocuments({ isPremium: true }),
            users.countDocuments({ isPremium: true, createdAt: { $gte: startDate } }),
            users.countDocuments({ lastSeen: { $gte: todayStart } }),
            users.countDocuments({ lastSeen: { $gte: weekStart } }),
            users.countDocuments({ lastSeen: { $gte: monthStart } }),
            users.aggregate([
                { $group: { _id: { $ifNull: ['$gender', 'unknown'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]).toArray(),
            users.aggregate([
                { $group: { _id: { $ifNull: ['$platform', 'unknown'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]).toArray(),
            users.aggregate([
                { $group: { _id: { $ifNull: ['$preferredLanguage', 'unknown'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]).toArray(),
            users.aggregate([
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $gt: [{ $strLenCP: { $ifNull: ['$timezone', ''] } }, 0] },
                                '$timezone',
                                'unknown',
                            ],
                        },
                        count: { $sum: 1 },
                        premiumCount: { $sum: { $cond: [{ $eq: ['$isPremium', true] }, 1, 0] } },
                        iosCount: { $sum: { $cond: [{ $eq: ['$platform', 'ios'] }, 1, 0] } },
                        androidCount: { $sum: { $cond: [{ $eq: ['$platform', 'android'] }, 1, 0] } },
                    },
                },
                { $sort: { count: -1, _id: 1 } },
            ]).toArray(),
            users.aggregate([
                {
                    $group: {
                        _id: {
                            version: { $ifNull: ['$appVersion', 'unknown'] },
                            platform: { $ifNull: ['$platform', 'unknown'] },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]).toArray(),
            users.aggregate([
                {
                    $group: {
                        _id: null,
                        tracked: { $sum: { $cond: [{ $gt: [{ $ifNull: ['$onboarding.version', 0] }, 0] }, 1, 0] } },
                        intro: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.introCompletedAt', null] }, null] }, 1, 0] } },
                        nickname: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.nicknameCompletedAt', null] }, null] }, 1, 0] } },
                        nicknamePresent: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$nickname', ''] }, ''] }, 1, 0] } },
                        avatar: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.avatarDecisionAt', null] }, null] }, 1, 0] } },
                        profile: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: [{ $ifNull: ['$nickname', ''] }, ''] },
                                            { $ne: [{ $ifNull: ['$avatar', ''] }, ''] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        nicknameStage: {
                            $sum: { $cond: [{ $and: [
                                { $gt: [{ $ifNull: ['$onboarding.version', 0] }, 0] },
                                { $ne: [{ $ifNull: ['$nickname', ''] }, ''] },
                            ] }, 1, 0] },
                        },
                        avatarStage: {
                            $sum: { $cond: [{ $and: [
                                { $gt: [{ $ifNull: ['$onboarding.version', 0] }, 0] },
                                { $ne: [{ $ifNull: ['$nickname', ''] }, ''] },
                                { $ne: [{ $ifNull: ['$onboarding.avatarDecisionAt', null] }, null] },
                            ] }, 1, 0] },
                        },
                        notificationStage: {
                            $sum: { $cond: [{ $and: [
                                { $gt: [{ $ifNull: ['$onboarding.version', 0] }, 0] },
                                { $ne: [{ $ifNull: ['$nickname', ''] }, ''] },
                                { $ne: [{ $ifNull: ['$onboarding.avatarDecisionAt', null] }, null] },
                                { $ne: [{ $ifNull: ['$onboarding.notificationPromptedAt', null] }, null] },
                            ] }, 1, 0] },
                        },
                        partnerStage: {
                            $sum: { $cond: [{ $and: [
                                { $gt: [{ $ifNull: ['$onboarding.version', 0] }, 0] },
                                { $ne: [{ $ifNull: ['$nickname', ''] }, ''] },
                                { $ne: [{ $ifNull: ['$onboarding.avatarDecisionAt', null] }, null] },
                                { $ne: [{ $ifNull: ['$onboarding.notificationPromptedAt', null] }, null] },
                                { $ne: [{ $ifNull: ['$onboarding.partnerStepCompletedAt', null] }, null] },
                            ] }, 1, 0] },
                        },
                        completedStage: {
                            $sum: { $cond: [{ $and: [
                                { $gt: [{ $ifNull: ['$onboarding.version', 0] }, 0] },
                                { $ne: [{ $ifNull: ['$nickname', ''] }, ''] },
                                { $ne: [{ $ifNull: ['$onboarding.avatarDecisionAt', null] }, null] },
                                { $ne: [{ $ifNull: ['$onboarding.notificationPromptedAt', null] }, null] },
                                { $ne: [{ $ifNull: ['$onboarding.partnerStepCompletedAt', null] }, null] },
                                { $ne: [{ $ifNull: ['$onboarding.completedAt', null] }, null] },
                            ] }, 1, 0] },
                        },
                        notifications: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.notificationPromptedAt', null] }, null] }, 1, 0] } },
                        partner: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.partnerStepCompletedAt', null] }, null] }, 1, 0] } },
                        premiumOffer: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.premiumOfferShownAt', null] }, null] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$onboarding.completedAt', null] }, null] }, 1, 0] } },
                        paired: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$partnerId', null] }, null] }, 1, 0] } },
                    },
                },
            ]).toArray(),
            users.aggregate(dailyActivityPipeline({ startDate, dateField: '$createdAt' })).toArray(),
            couples.aggregate(dailyActivityPipeline({ startDate, dateField: '$connectionDate' })).toArray(),
            couples.aggregate(dailyActivityPipeline({
                startDate,
                dateField: '$unpairedDate',
                match: { status: 'unpaired' },
            })).toArray(),
            chats.aggregate([
                { $unwind: '$messages' },
                {
                    $match: {
                        'messages.createdAt': { $gte: startDate },
                        $or: [
                            { 'messages.messageType': { $in: ['text', 'image'] } },
                            {
                                'messages.messageType': 'answer',
                                questionSource: { $ne: 'dailychallenge' },
                            },
                        ],
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$messages.createdAt', timezone: REPORT_TIMEZONE } },
                        count: { $sum: 1 },
                        messages: {
                            $sum: { $cond: [{ $in: ['$messages.messageType', ['text', 'image']] }, 1, 0] },
                        },
                        answers: {
                            $sum: { $cond: [{ $eq: ['$messages.messageType', 'answer'] }, 1, 0] },
                        },
                        couples: { $addToSet: '$coupleId' },
                    },
                },
            ]).toArray(),
            chatMessagesV2.aggregate([
                { $match: { createdAt: { $gte: startDate }, messageType: 'text' } },
                {
                    $lookup: {
                        from: 'questionchatv2',
                        localField: 'chatId',
                        foreignField: '_id',
                        as: 'chat',
                    },
                },
                { $set: { coupleId: { $arrayElemAt: ['$chat.coupleId', 0] } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: REPORT_TIMEZONE } },
                        count: { $sum: 1 },
                        couples: { $addToSet: '$coupleId' },
                    },
                },
            ]).toArray(),
            questionAnswersV2.aggregate(dailyActivityPipeline({
                startDate,
                dateField: '$createdAt',
                coupleField: '$coupleId',
            })).toArray(),
            dailyAnswers.aggregate([
                { $unwind: '$answers' },
                { $match: { 'answers.answeredAt': { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$answers.answeredAt', timezone: REPORT_TIMEZONE } },
                        count: { $sum: 1 },
                        couples: { $addToSet: '$coupleId' },
                    },
                },
            ]).toArray(),
            moodLogs.aggregate(dailyActivityPipeline({
                startDate,
                dateField: '$updatedAt',
                coupleField: '$partnerId',
            })).toArray(),
            memories.aggregate(dailyActivityPipeline({
                startDate,
                dateField: '$createdAt',
                coupleField: '$coupleId',
                match: { deletedAt: null },
            })).toArray(),
            couples.aggregate(dailyActivityPipeline({
                startDate,
                dateField: '$liveScribble.updatedAt',
                coupleField: '$_id',
            })).toArray(),
            tictactoes.aggregate([
                { $match: { completedAt: { $gte: startDate } } },
                {
                    $set: {
                        analyticsCoupleId: {
                            $concat: [{ $toString: '$creatorId' }, '_', { $toString: '$partnerId' }],
                        },
                    },
                },
                ...dailyActivityPipeline({
                    startDate,
                    dateField: '$completedAt',
                    coupleField: '$analyticsCoupleId',
                }),
            ]).toArray(),
            wordles.aggregate([
                { $match: { completedAt: { $gte: startDate } } },
                {
                    $set: {
                        analyticsCoupleId: {
                            $concat: [{ $toString: '$creatorId' }, '_', { $toString: '$partnerId' }],
                        },
                    },
                },
                ...dailyActivityPipeline({
                    startDate,
                    dateField: '$completedAt',
                    coupleField: '$analyticsCoupleId',
                }),
            ]).toArray(),
            puzzles.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $set: {
                        analyticsCoupleId: {
                            $concat: [{ $toString: '$creatorId' }, '_', { $toString: '$partnerId' }],
                        },
                    },
                },
                ...dailyActivityPipeline({
                    startDate,
                    dateField: '$createdAt',
                    coupleField: '$analyticsCoupleId',
                }),
            ]).toArray(),
            wordSearchGames.aggregate([
                { $match: { completedAt: { $gte: startDate } } },
                {
                    $set: {
                        analyticsCoupleId: {
                            $cond: [
                                { $and: ['$partnerId', { $ne: ['$partnerId', null] }] },
                                { $concat: [{ $toString: '$creatorId' }, '_', { $toString: '$partnerId' }] },
                                { $toString: '$creatorId' },
                            ],
                        },
                    },
                },
                ...dailyActivityPipeline({
                    startDate,
                    dateField: '$completedAt',
                    coupleField: '$analyticsCoupleId',
                }),
            ]).toArray(),
            ritualStatuses.aggregate([
                { $match: { opensAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$opensAt', timezone: REPORT_TIMEZONE } },
                        full: { $sum: { $cond: [{ $eq: ['$heartState', 'full'] }, 1, 0] } },
                        half: { $sum: { $cond: [{ $eq: ['$heartState', 'half'] }, 1, 0] } },
                        empty: { $sum: { $cond: [{ $eq: ['$heartState', 'empty'] }, 1, 0] } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]).toArray(),
            ritualStatuses.aggregate([
                { $match: { opensAt: { $gte: startDate } } },
                { $group: { _id: '$heartState', count: { $sum: 1 } } },
            ]).toArray(),
            streaks.aggregate([
                {
                    $group: {
                        _id: null,
                        averageCurrent: { $avg: '$currentStreak' },
                        longest: { $max: '$longestStreak' },
                        active: { $sum: { $cond: [{ $gt: ['$currentStreak', 0] }, 1, 0] } },
                    },
                },
            ]).toArray(),
            questionProgressV2.aggregate([
                {
                    $group: {
                        _id: null,
                        seen: { $sum: { $size: { $ifNull: ['$seenQuestionIds', []] } } },
                        skipped: { $sum: { $size: { $ifNull: ['$skippedQuestionIds', []] } } },
                        answered: { $sum: { $size: { $ifNull: ['$answeredQuestionIds', []] } } },
                        completedSets: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$completedAt', null] }, null] }, 1, 0] } },
                        startedSets: { $sum: 1 },
                    },
                },
            ]).toArray(),
            questionAnswersV2.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$topicId', count: { $sum: 1 }, users: { $addToSet: '$userId' } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]).toArray(),
            questionAnswersV2.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$format', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]).toArray(),
            subscriptions.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 }, access: { $sum: { $cond: ['$givesAccess', 1, 0] } } } },
                { $sort: { count: -1 } },
            ]).toArray(),
            users.aggregate([
                {
                    $project: {
                        widgets: {
                            $map: {
                                input: { $objectToArray: { $ifNull: ['$widgetStatus', {}] } },
                                as: 'widget',
                                in: {
                                    name: '$$widget.k',
                                    installed: '$$widget.v.installed',
                                    intentEnabled: '$$widget.v.intentEnabled',
                                },
                            },
                        },
                    },
                },
                { $unwind: '$widgets' },
                {
                    $group: {
                        _id: '$widgets.name',
                        installed: { $sum: { $cond: ['$widgets.installed', 1, 0] } },
                        intent: { $sum: { $cond: ['$widgets.intentEnabled', 1, 0] } },
                    },
                },
                { $sort: { installed: -1 } },
            ]).toArray(),
            users.aggregate([
                {
                    $group: {
                        _id: null,
                        currentlySharing: {
                            $sum: { $cond: [{ $eq: ['$locationSharingEnabled', true] }, 1, 0] },
                        },
                        everShared: {
                            $sum: {
                                $cond: [
                                    { $ne: [{ $ifNull: ['$locationUpdatedAt', null] }, null] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        updatedInPeriod: {
                            $sum: { $cond: [{ $gte: ['$locationUpdatedAt', startDate] }, 1, 0] },
                        },
                    },
                },
            ]).toArray(),
            Promise.all([
                chats.countDocuments({ lastMessageAt: { $gte: startDate } }),
                questionAnswersV2.countDocuments({ createdAt: { $gte: startDate } }),
                ritualStatuses.countDocuments({ opensAt: { $gte: startDate }, heartState: 'full' }),
                moodLogs.countDocuments({ updatedAt: { $gte: startDate } }),
                memories.countDocuments({ createdAt: { $gte: startDate }, deletedAt: null }),
                tictactoes.countDocuments({ completedAt: { $gte: startDate } }),
                wordles.countDocuments({ completedAt: { $gte: startDate } }),
                puzzles.countDocuments({ createdAt: { $gte: startDate } }),
                wordSearchGames.countDocuments({ completedAt: { $gte: startDate } }),
            ]),
            Promise.all([
                tictactoes.countDocuments({ completedAt: { $gte: todayStart } }),
                wordles.countDocuments({ completedAt: { $gte: todayStart } }),
                puzzles.countDocuments({ createdAt: { $gte: todayStart } }),
                wordSearchGames.countDocuments({ completedAt: { $gte: todayStart } }),
            ]),
            callDiagnostics.aggregate([
                {
                    $set: {
                        analyticsDate: { $ifNull: ['$startedAt', '$createdAt'] },
                        connectedReport: {
                            $cond: [{ $ne: [{ $ifNull: ['$timeToConnectedMs', null] }, null] }, 1, 0],
                        },
                        successfulMediaReport: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: [{ $ifNull: ['$timeToConnectedMs', null] }, null] },
                                        {
                                            $or: [
                                                {
                                                    $and: [
                                                        { $gt: [{ $ifNull: ['$outboundAudioBytes', 0] }, 0] },
                                                        { $gt: [{ $ifNull: ['$inboundAudioBytes', 0] }, 0] },
                                                    ],
                                                },
                                                {
                                                    $and: [
                                                        { $gt: [{ $ifNull: ['$outboundVideoBytes', 0] }, 0] },
                                                        { $gt: [{ $ifNull: ['$inboundVideoBytes', 0] }, 0] },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
                { $match: { analyticsDate: { $gte: startDate } } },
                {
                    $group: {
                        _id: '$callId',
                        date: { $min: '$analyticsDate' },
                        reports: { $sum: 1 },
                        reporters: { $addToSet: '$reporterId' },
                        connected: { $max: '$connectedReport' },
                        successful: { $max: '$successfulMediaReport' },
                        outcomes: { $addToSet: '$outcome' },
                        failureCodes: { $addToSet: '$failureCode' },
                        connectionTimeMs: {
                            $max: {
                                $cond: [
                                    { $ne: [{ $ifNull: ['$timeToConnectedMs', null] }, null] },
                                    '$timeToConnectedMs',
                                    null,
                                ],
                            },
                        },
                    },
                },
                {
                    $set: {
                        twoSided: { $cond: [{ $gte: [{ $size: '$reporters' }, 2] }, 1, 0] },
                        status: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$successful', 1] }, then: 'successful' },
                                    { case: { $eq: ['$connected', 1] }, then: 'connected_no_media' },
                                    { case: { $in: ['failed', '$outcomes'] }, then: 'failed' },
                                    { case: { $in: ['rejected', '$outcomes'] }, then: 'rejected' },
                                    { case: { $in: ['missed', '$outcomes'] }, then: 'missed' },
                                    { case: { $in: ['cancelled', '$outcomes'] }, then: 'cancelled' },
                                ],
                                default: 'ended_unconfirmed',
                            },
                        },
                    },
                },
                {
                    $facet: {
                        summary: [
                            {
                                $group: {
                                    _id: null,
                                    attempts: { $sum: 1 },
                                    connected: { $sum: '$connected' },
                                    successful: { $sum: '$successful' },
                                    diagnosticReports: { $sum: '$reports' },
                                    twoSidedCalls: { $sum: '$twoSided' },
                                    averageConnectionTimeMs: { $avg: '$connectionTimeMs' },
                                },
                            },
                        ],
                        trend: [
                            {
                                $group: {
                                    _id: {
                                        $dateToString: {
                                            format: '%Y-%m-%d',
                                            date: '$date',
                                            timezone: REPORT_TIMEZONE,
                                        },
                                    },
                                    attempts: { $sum: 1 },
                                    connected: { $sum: '$connected' },
                                    successful: { $sum: '$successful' },
                                },
                            },
                            { $sort: { _id: 1 } },
                        ],
                        statuses: [
                            { $group: { _id: '$status', count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                        ],
                        failures: [
                            { $unwind: '$failureCodes' },
                            { $match: { failureCodes: { $nin: [null, 'remote_ended'] } } },
                            { $group: { _id: '$failureCodes', count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                        ],
                    },
                },
            ]).toArray(),
        ]);

        const engagementTrend = mergeDailySeries([
            legacyChatActivity,
            v2MessageActivity,
            v2AnswerActivity,
            dailyAnswerActivity,
            moodActivity,
            memoryActivity,
            scribbleActivity,
            tictactoeActivity,
            wordleActivity,
            puzzleActivity,
            wordSearchActivity,
        ], days);

        const countByDate = (series) => new Map(series.map((item) => [item._id, item.count || 0]));
        const legacyMessageCounts = countByDate(
            legacyChatActivity.map((item) => ({ ...item, count: item.messages || 0 })),
        );
        const legacyAnswerCounts = countByDate(
            legacyChatActivity.map((item) => ({ ...item, count: item.answers || 0 })),
        );
        const v2MessageCounts = countByDate(v2MessageActivity);
        const v2AnswerCounts = countByDate(v2AnswerActivity);
        const dailyAnswerCounts = countByDate(dailyAnswerActivity);
        const moodCounts = countByDate(moodActivity);
        const memoryCounts = countByDate(memoryActivity);
        const scribbleCounts = countByDate(scribbleActivity);
        const tictactoeCounts = countByDate(tictactoeActivity);
        const wordleCounts = countByDate(wordleActivity);
        const puzzleCounts = countByDate(puzzleActivity);
        const wordSearchCounts = countByDate(wordSearchActivity);
        const engagementTrendWithBreakdown = engagementTrend.map((item) => ({
            ...item,
            messages: (legacyMessageCounts.get(item.date) || 0) + (v2MessageCounts.get(item.date) || 0),
            answers: (legacyAnswerCounts.get(item.date) || 0)
                + (v2AnswerCounts.get(item.date) || 0)
                + (dailyAnswerCounts.get(item.date) || 0),
            moods: moodCounts.get(item.date) || 0,
            memories: memoryCounts.get(item.date) || 0,
            scribbles: scribbleCounts.get(item.date) || 0,
            games: (tictactoeCounts.get(item.date) || 0)
                + (wordleCounts.get(item.date) || 0)
                + (puzzleCounts.get(item.date) || 0)
                + (wordSearchCounts.get(item.date) || 0),
        }));

        const todayEngagements = engagementTrendWithBreakdown.at(-1)?.count || 0;
        const onboarding = onboardingCounts[0] || {};
        const ritualStates = Object.fromEntries(ritualStateCounts.map((item) => [item._id, item.count]));
        const ritualTotal = ritualStateCounts.reduce((sum, item) => sum + item.count, 0);
        const progress = questionProgressSummary[0] || {};
        const streak = streakSummary[0] || {};
        const featureNames = ['Question chats', 'Question answers', 'Mutual rituals', 'Mood updates', 'Memories', 'Tic-Tac-Toe', 'Wordle', 'Puzzles created', 'Word Search'];
        const gameCounts = featureCounts.slice(5);
        const callResult = callAnalytics[0] || {};
        const callSummary = callResult.summary?.[0] || {};
        const callTrendByDate = new Map((callResult.trend || []).map((item) => [item._id, item]));
        const callTrend = fillMissingDates([], days).map((item) => {
            const day = callTrendByDate.get(item.date) || {};
            return {
                date: item.date,
                attempts: day.attempts || 0,
                connected: day.connected || 0,
                successful: day.successful || 0,
            };
        });
        const timezoneCountries = groupTimezonesByCountry(timezoneCounts);

        const payload = {
            report: {
                days,
                startDate,
                endDate: new Date(),
                timezone: 'Asia/Kolkata',
                timezoneOffset: `UTC${REPORT_TIMEZONE}`,
                engagementDefinition: 'Persisted messages, answers, moods, memories, latest Scribble updates, and game activity',
                scribbleDefinition: 'Couples whose latest saved Scribble was updated; repeated and overwritten Scribbles are not retained as history',
            },
            metrics: {
                totalUsers,
                activeCouples,
                todayEngagements,
                todayGames: todayGameActivity.reduce((sum, value) => sum + value, 0),
                dau,
                wau,
                mau,
                premiumUsers,
                rangeUsers: userTrendData.reduce((sum, item) => sum + (item.count || 0), 0),
                rangeCouples: coupleTrendData.reduce((sum, item) => sum + (item.count || 0), 0),
                rangePremiumUsers,
                onboardingCompleted: onboarding.completedStage || 0,
                onboardingTracked: onboarding.tracked || 0,
                profilesWithPhoto: onboarding.profile || 0,
            },
            rates: {
                pairing: percentage(onboarding.paired || 0, totalUsers),
                profileReady: percentage(onboarding.profile || 0, totalUsers),
                premium: percentage(premiumUsers, totalUsers),
                mutualRitual: percentage(ritualStates.full || 0, ritualTotal),
                questionAnswer: percentage(progress.answered || 0, progress.seen || 0),
                questionSetCompletion: percentage(progress.completedSets || 0, progress.startedSets || 0),
            },
            funnel: [
                { name: 'Registered users', value: totalUsers },
                { name: 'Added a nickname', value: onboarding.nicknamePresent || 0 },
                { name: 'Nickname + profile photo', value: onboarding.profile || 0 },
                { name: 'Paired with partner', value: onboarding.paired || 0 },
            ],
            trends: {
                userTrend: fillMissingDates(userTrendData, days),
                coupleTrend: fillMissingDates(coupleTrendData, days),
                unpairTrend: fillMissingDates(unpairTrendData, days),
                engagementTrend: engagementTrendWithBreakdown,
                ritualTrend: fillMissingDates(
                    ritualTrendData.map((item) => ({ ...item, count: item.full })),
                    days,
                ),
                gameTrends: {
                    tictactoe: fillMissingDates(tictactoeActivity, days),
                    wordle: fillMissingDates(wordleActivity, days),
                    jigsaw: fillMissingDates(puzzleActivity, days),
                    wordsearch: fillMissingDates(wordSearchActivity, days),
                },
            },
            splits: {
                gender: genderCounts.map((item) => ({ name: item._id || 'unknown', value: item.count })),
                platform: platformCounts.map((item) => ({ name: item._id || 'unknown', value: item.count })),
                language: languageCounts.map((item) => ({ name: item._id || 'unknown', value: item.count })),
                timezone: timezoneCounts.map((item) => ({ name: item._id || 'unknown', value: item.count })),
                timezoneCountries,
                connectivity: [
                    { name: 'Active', value: activeCouples },
                    { name: 'Unpaired', value: unpairedCouples },
                ],
                games: [
                    { name: 'Tic-Tac-Toe', value: gameCounts[0] || 0 },
                    { name: 'Wordle', value: gameCounts[1] || 0 },
                    { name: 'Puzzles created', value: gameCounts[2] || 0 },
                    { name: 'Word Search', value: gameCounts[3] || 0 },
                ],
                subscriptions: subscriptionCounts.map((item) => ({ name: item._id || 'unknown', value: item.count })),
            },
            onboarding: {
                tracked: onboarding.tracked || 0,
                intro: onboarding.intro || 0,
                nickname: onboarding.nickname || 0,
                usersWithNickname: onboarding.nicknamePresent || 0,
                avatar: onboarding.avatar || 0,
                profileWithPhoto: onboarding.profile || 0,
                notifications: onboarding.notifications || 0,
                partner: onboarding.partner || 0,
                currentlyPaired: onboarding.paired || 0,
                premiumOffer: onboarding.premiumOffer || 0,
                completed: onboarding.completedStage || 0,
            },
            rituals: {
                full: ritualStates.full || 0,
                half: ritualStates.half || 0,
                empty: ritualStates.empty || 0,
                averageCurrentStreak: Math.round((streak.averageCurrent || 0) * 10) / 10,
                longestStreak: streak.longest || 0,
                couplesWithActiveStreak: streak.active || 0,
            },
            questions: {
                seen: progress.seen || 0,
                skipped: progress.skipped || 0,
                answered: progress.answered || 0,
                completedSets: progress.completedSets || 0,
                startedSets: progress.startedSets || 0,
                topics: topicCounts.map((item) => ({
                    name: item._id || 'unknown',
                    value: item.count,
                    users: item.users?.length || 0,
                })),
                formats: formatCounts.map((item) => ({ name: item._id || 'unknown', value: item.count })),
            },
            featureAdoption: featureNames.map((name, index) => ({
                name,
                value: featureCounts[index] || 0,
            })),
            versions: versionCounts.map((item) => ({
                version: item._id.version,
                platform: item._id.platform,
                users: item.count,
            })),
            widgets: widgetSummary.map((item) => ({
                name: item._id,
                installed: item.installed,
                intent: item.intent,
            })),
            locationSharing: {
                sharingEnabled: locationSummary[0]?.currentlySharing || 0,
                everShared: locationSummary[0]?.everShared || 0,
                updatedInPeriod: locationSummary[0]?.updatedInPeriod || 0,
                source: 'users.locationSharingEnabled and users.locationUpdatedAt',
                caveat: 'Sharing enabled is a stored preference. Ever shared proves that the server received a location; neither is the raw operating-system permission state.',
            },
            calls: {
                attempts: callSummary.attempts || 0,
                connected: callSummary.connected || 0,
                successful: callSummary.successful || 0,
                unsuccessful: Math.max((callSummary.attempts || 0) - (callSummary.successful || 0), 0),
                connectionRate: percentage(callSummary.connected || 0, callSummary.attempts || 0),
                successRate: percentage(callSummary.successful || 0, callSummary.attempts || 0),
                diagnosticReports: callSummary.diagnosticReports || 0,
                twoSidedCalls: callSummary.twoSidedCalls || 0,
                twoSidedCoverage: percentage(callSummary.twoSidedCalls || 0, callSummary.attempts || 0),
                averageConnectionTimeMs: Math.round(callSummary.averageConnectionTimeMs || 0),
                trend: callTrend,
                statuses: (callResult.statuses || []).map((item) => ({
                    name: item._id,
                    value: item.count,
                })),
                failures: (callResult.failures || []).map((item) => ({
                    name: item._id,
                    value: item.count,
                })),
                retentionDays: 30,
                definition: 'Connected with media bytes sent and received in at least one participant diagnostic',
                caveat: 'Client-reported diagnostics only. Calls without a saved diagnostic are not included, and records expire after 30 days.',
            },
        };

        // Bound memory usage in warm serverless instances. The dashboard only
        // exposes a small fixed set of ranges, but this also handles arbitrary
        // valid API requests safely.
        if (summaryCache.size >= 8) {
            const oldestKey = summaryCache.keys().next().value;
            summaryCache.delete(oldestKey);
        }
        summaryCache.set(days, {
            expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS,
            payload,
        });

        res.set('Cache-Control', 'private, no-store');
        res.set('X-Analytics-Cache', 'MISS');
        return res.json(payload);
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Failed to aggregate analytics' });
    }
};

export const getTimezoneDistribution = async (req, res) => {
    try {
        const { days: daysParam, startDate: reqStartDate, endDate: reqEndDate } = req.query;
        const db = mongoose.connection.db;
        const users = db.collection('users');

        const matchFilter = {};
        let dateQuery = null;

        if (reqStartDate && reqEndDate) {
            const startDate = new Date(`${reqStartDate}T00:00:00.000+05:30`);
            const endDate = new Date(`${reqEndDate}T23:59:59.999+05:30`);
            dateQuery = { $gte: startDate, $lte: endDate };
            matchFilter.createdAt = dateQuery;
        } else if (daysParam !== undefined && daysParam !== null) {
            const parsedDays = Number.parseInt(daysParam, 10);
            if (Number.isFinite(parsedDays) && parsedDays > 0) {
                dateQuery = { $gte: startOfReportDay(parsedDays) };
                matchFilter.createdAt = dateQuery;
            }
        }

        const timezoneCounts = await users.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $gt: [{ $strLenCP: { $ifNull: ['$timezone', ''] } }, 0] },
                            '$timezone',
                            'unknown',
                        ],
                    },
                    count: { $sum: 1 },
                    premiumCount: { $sum: { $cond: [{ $eq: ['$isPremium', true] }, 1, 0] } },
                    iosCount: { $sum: { $cond: [{ $eq: ['$platform', 'ios'] }, 1, 0] } },
                    androidCount: { $sum: { $cond: [{ $eq: ['$platform', 'android'] }, 1, 0] } },
                },
            },
            { $sort: { count: -1, _id: 1 } },
        ]).toArray();

        const totalUsersInRange = dateQuery
            ? await users.countDocuments({ createdAt: dateQuery })
            : await users.countDocuments();
        const premiumUsersInRange = dateQuery
            ? await users.countDocuments({ isPremium: true, createdAt: dateQuery })
            : await users.countDocuments({ isPremium: true });

        const countries = groupTimezonesByCountry(timezoneCounts);
        const conversionRate = totalUsersInRange > 0
            ? Math.round((premiumUsersInRange / totalUsersInRange) * 1000) / 10
            : 0;

        res.json({
            countries,
            totalUsers: totalUsersInRange,
            premiumUsers: premiumUsersInRange,
            conversionRate,
            topMarket: countries[0] || null,
        });
    } catch (err) {
        console.error('Error in getTimezoneDistribution:', err);
        res.status(500).json({ error: 'Failed to fetch timezone distribution' });
    }
};

export const getCallHealth = async (req, res) => {
    try {
        const { days: daysParam, startDate: reqStartDate, endDate: reqEndDate } = req.query;
        const db = mongoose.connection.db;
        const callDiagnostics = db.collection('calldiagnostics');

        let startDate;
        let endDate = new Date();
        let days = 28;
        let isCustom = false;

        if (reqStartDate && reqEndDate) {
            startDate = new Date(`${reqStartDate}T00:00:00.000+05:30`);
            endDate = new Date(`${reqEndDate}T23:59:59.999+05:30`);
            isCustom = true;
            const diffDays = Math.ceil((endDate - startDate) / DAY_MS);
            days = Math.max(diffDays, 1);
        } else if (daysParam !== undefined && daysParam !== null) {
            const parsedDays = Number.parseInt(daysParam, 10);
            if (Number.isFinite(parsedDays) && parsedDays > 0) {
                days = Math.min(Math.max(parsedDays, 1), 30); // diagnostics expire after 30 days
                startDate = startOfReportDay(days);
            } else {
                days = 30;
                startDate = startOfReportDay(30);
            }
        } else {
            days = 28;
            startDate = startOfReportDay(28);
        }

        const dateMatch = isCustom
            ? { analyticsDate: { $gte: startDate, $lte: endDate } }
            : { analyticsDate: { $gte: startDate } };

        const [callAnalytics] = await callDiagnostics.aggregate([
            {
                $set: {
                    analyticsDate: { $ifNull: ['$startedAt', '$createdAt'] },
                    connectedReport: {
                        $cond: [{ $ne: [{ $ifNull: ['$timeToConnectedMs', null] }, null] }, 1, 0],
                    },
                    successfulMediaReport: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: [{ $ifNull: ['$timeToConnectedMs', null] }, null] },
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    { $gt: [{ $ifNull: ['$outboundAudioBytes', 0] }, 0] },
                                                    { $gt: [{ $ifNull: ['$inboundAudioBytes', 0] }, 0] },
                                                ],
                                            },
                                            {
                                                $and: [
                                                    { $gt: [{ $ifNull: ['$outboundVideoBytes', 0] }, 0] },
                                                    { $gt: [{ $ifNull: ['$inboundVideoBytes', 0] }, 0] },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
            { $match: dateMatch },
            {
                $group: {
                    _id: '$callId',
                    date: { $min: '$analyticsDate' },
                    reports: { $sum: 1 },
                    reporters: { $addToSet: '$reporterId' },
                    partners: { $addToSet: '$partnerId' },
                    connected: { $max: '$connectedReport' },
                    successful: { $max: '$successfulMediaReport' },
                    outcomes: { $addToSet: '$outcome' },
                    failureCodes: { $addToSet: '$failureCode' },
                    platforms: { $addToSet: '$platform' },
                    connectionTimeMs: {
                        $max: {
                            $cond: [
                                { $ne: [{ $ifNull: ['$timeToConnectedMs', null] }, null] },
                                '$timeToConnectedMs',
                                null,
                            ],
                        },
                    },
                },
            },
            {
                $set: {
                    twoSided: { $cond: [{ $gte: [{ $size: '$reporters' }, 2] }, 1, 0] },
                    callUsers: {
                        $filter: {
                            input: {
                                $map: {
                                    input: { $setUnion: ['$reporters', '$partners'] },
                                    as: 'u',
                                    in: {
                                        $cond: [
                                            { $ne: ['$$u', null] },
                                            { $toString: '$$u' },
                                            null,
                                        ],
                                    },
                                },
                            },
                            as: 'u',
                            cond: {
                                $and: [
                                    { $ne: ['$$u', null] },
                                    { $ne: ['$$u', ''] },
                                    { $ne: ['$$u', 'null'] },
                                    { $ne: ['$$u', 'undefined'] },
                                ],
                            },
                        },
                    },
                    status: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$successful', 1] }, then: 'successful' },
                                { case: { $eq: ['$connected', 1] }, then: 'connected_no_media' },
                                { case: { $in: ['failed', '$outcomes'] }, then: 'failed' },
                                { case: { $in: ['rejected', '$outcomes'] }, then: 'rejected' },
                                { case: { $in: ['missed', '$outcomes'] }, then: 'missed' },
                                { case: { $in: ['cancelled', '$outcomes'] }, then: 'cancelled' },
                            ],
                            default: 'ended_unconfirmed',
                        },
                    },
                },
            },
            {
                $facet: {
                    summary: [
                        {
                            $group: {
                                _id: null,
                                attempts: { $sum: 1 },
                                connected: { $sum: '$connected' },
                                successful: { $sum: '$successful' },
                                connectedNoMedia: {
                                    $sum: { $cond: [{ $eq: ['$status', 'connected_no_media'] }, 1, 0] },
                                },
                                missed: {
                                    $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] },
                                },
                                rejected: {
                                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
                                },
                                failed: {
                                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
                                },
                                cancelled: {
                                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                                },
                                diagnosticReports: { $sum: '$reports' },
                                twoSidedCalls: { $sum: '$twoSided' },
                                averageConnectionTimeMs: { $avg: '$connectionTimeMs' },
                                allUsers: { $push: '$callUsers' },
                            },
                        },
                        {
                            $project: {
                                attempts: 1,
                                connected: 1,
                                successful: 1,
                                connectedNoMedia: 1,
                                missed: 1,
                                rejected: 1,
                                failed: 1,
                                cancelled: 1,
                                diagnosticReports: 1,
                                twoSidedCalls: 1,
                                averageConnectionTimeMs: 1,
                                uniqueUsers: {
                                    $size: {
                                        $reduce: {
                                            input: { $ifNull: ['$allUsers', []] },
                                            initialValue: [],
                                            in: { $setUnion: ['$$value', { $ifNull: ['$$this', []] }] },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                    trend: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$date',
                                        timezone: REPORT_TIMEZONE,
                                    },
                                },
                                attempts: { $sum: 1 },
                                connected: { $sum: '$connected' },
                                successful: { $sum: '$successful' },
                                connectedNoMedia: {
                                    $sum: { $cond: [{ $eq: ['$status', 'connected_no_media'] }, 1, 0] },
                                },
                                missed: {
                                    $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] },
                                },
                                rejected: {
                                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
                                },
                                failed: {
                                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
                                },
                                cancelled: {
                                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                                },
                                allUsers: { $push: '$callUsers' },
                            },
                        },
                        {
                            $project: {
                                attempts: 1,
                                connected: 1,
                                successful: 1,
                                connectedNoMedia: 1,
                                missed: 1,
                                rejected: 1,
                                failed: 1,
                                cancelled: 1,
                                uniqueUsers: {
                                    $size: {
                                        $reduce: {
                                            input: { $ifNull: ['$allUsers', []] },
                                            initialValue: [],
                                            in: { $setUnion: ['$$value', { $ifNull: ['$$this', []] }] },
                                        },
                                    },
                                },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],
                    statuses: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ],
                    failures: [
                        { $unwind: '$failureCodes' },
                        { $match: { failureCodes: { $nin: [null, 'remote_ended'] } } },
                        { $group: { _id: '$failureCodes', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ],
                    platforms: [
                        { $unwind: '$platforms' },
                        { $match: { platforms: { $nin: [null, 'unknown'] } } },
                        { $group: { _id: '$platforms', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ],
                    recentCalls: [
                        { $sort: { date: -1 } },
                        { $limit: 30 },
                        {
                            $project: {
                                callId: '$_id',
                                date: 1,
                                status: 1,
                                reports: 1,
                                connected: 1,
                                successful: 1,
                                twoSided: 1,
                                connectionTimeMs: 1,
                                outcomes: 1,
                                failureCodes: {
                                    $filter: {
                                        input: '$failureCodes',
                                        as: 'code',
                                        cond: {
                                            $and: [
                                                { $ne: ['$$code', null] },
                                                { $ne: ['$$code', 'remote_ended'] },
                                            ],
                                        },
                                    },
                                },
                                platforms: {
                                    $filter: {
                                        input: '$platforms',
                                        as: 'p',
                                        cond: {
                                            $and: [
                                                { $ne: ['$$p', null] },
                                                { $ne: ['$$p', 'unknown'] },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ]).toArray();

        const callResult = callAnalytics || {};
        const callSummary = callResult.summary?.[0] || {};
        const callTrendByDate = new Map((callResult.trend || []).map((item) => [item._id, item]));

        let callTrend = [];
        if (isCustom) {
            const cur = new Date(startDate);
            while (cur <= endDate) {
                const key = dateKey(cur);
                const day = callTrendByDate.get(key) || {};
                callTrend.push({
                    date: key,
                    attempts: day.attempts || 0,
                    connected: day.connected || 0,
                    successful: day.successful || 0,
                    connectedNoMedia: day.connectedNoMedia || 0,
                    missed: day.missed || 0,
                    rejected: day.rejected || 0,
                    failed: day.failed || 0,
                    cancelled: day.cancelled || 0,
                    uniqueUsers: day.uniqueUsers || 0,
                });
                cur.setDate(cur.getDate() + 1);
            }
        } else {
            callTrend = fillMissingDates([], days).map((item) => {
                const day = callTrendByDate.get(item.date) || {};
                return {
                    date: item.date,
                    attempts: day.attempts || 0,
                    connected: day.connected || 0,
                    successful: day.successful || 0,
                    connectedNoMedia: day.connectedNoMedia || 0,
                    missed: day.missed || 0,
                    rejected: day.rejected || 0,
                    failed: day.failed || 0,
                    cancelled: day.cancelled || 0,
                    uniqueUsers: day.uniqueUsers || 0,
                };
            });
        }

        const attempts = callSummary.attempts || 0;
        const connected = callSummary.connected || 0;
        const successful = callSummary.successful || 0;
        const connectedNoMedia = callSummary.connectedNoMedia || 0;
        const missed = callSummary.missed || 0;
        const rejected = callSummary.rejected || 0;
        const failed = callSummary.failed || 0;
        const cancelled = callSummary.cancelled || 0;
        const uniqueUsers = callSummary.uniqueUsers || 0;

        res.json({
            attempts,
            connected,
            successful,
            connectedNoMedia,
            missed,
            rejected,
            failed,
            cancelled,
            uniqueUsers,
            unsuccessful: Math.max(attempts - successful, 0),
            connectionRate: percentage(connected, attempts),
            successRate: percentage(successful, attempts),
            missedRate: percentage(missed, attempts),
            rejectedRate: percentage(rejected, attempts),
            failedRate: percentage(failed, attempts),
            diagnosticReports: callSummary.diagnosticReports || 0,
            twoSidedCalls: callSummary.twoSidedCalls || 0,
            twoSidedCoverage: percentage(callSummary.twoSidedCalls || 0, attempts),
            averageConnectionTimeMs: Math.round(callSummary.averageConnectionTimeMs || 0),
            trend: callTrend,
            statuses: (callResult.statuses || []).map((item) => ({
                name: item._id,
                value: item.count,
            })),
            failures: (callResult.failures || []).map((item) => ({
                name: item._id,
                value: item.count,
            })),
            platforms: (callResult.platforms || []).map((item) => ({
                name: item._id,
                value: item.count,
            })),
            recentCalls: callResult.recentCalls || [],
            retentionDays: 30,
            definition: 'Connected with media bytes sent and received in at least one participant diagnostic',
            caveat: 'Client-reported diagnostics only. Calls without a saved diagnostic are not included, and records expire after 30 days.',
            range: {
                startDate,
                endDate,
                days,
                isCustom,
            },
        });
    } catch (err) {
        console.error('Error in getCallHealth:', err);
        res.status(500).json({ error: 'Failed to fetch call health diagnostics' });
    }
};

export const getQuestionEngagement = async (req, res) => {
    try {
        const { days: daysParam, startDate: reqStartDate, endDate: reqEndDate } = req.query;
        const db = mongoose.connection.db;
        const questionAnswers = db.collection('questionanswerv2');
        const questionProgress = db.collection('questionprogressv2');
        const questionChatMessages = db.collection('questionchatmessagev2');

        let startDate;
        let endDate = new Date();
        let days = 28;
        let isCustom = false;

        if (reqStartDate && reqEndDate) {
            startDate = new Date(`${reqStartDate}T00:00:00.000+05:30`);
            endDate = new Date(`${reqEndDate}T23:59:59.999+05:30`);
            isCustom = true;
            const diffDays = Math.ceil((endDate - startDate) / DAY_MS);
            days = Math.max(diffDays, 1);
        } else if (daysParam !== undefined && daysParam !== null) {
            const parsedDays = Number.parseInt(daysParam, 10);
            days = Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(Math.max(parsedDays, 1), 365) : 28;
            startDate = startOfReportDay(days);
        } else {
            days = 28;
            startDate = startOfReportDay(28);
        }

        const dateMatch = isCustom
            ? { createdAt: { $gte: startDate, $lte: endDate } }
            : { createdAt: { $gte: startDate } };

        const [
            totalAnswers,
            uniqueStats,
            progressStats,
            dailyAnswersTrend,
            topicBreakdown,
            formatBreakdown,
            chatMessageCount,
            recentAnswers,
        ] = await Promise.all([
            questionAnswers.countDocuments(dateMatch),
            questionAnswers.aggregate([
                { $match: dateMatch },
                {
                    $group: {
                        _id: null,
                        uniqueUsers: { $addToSet: '$userId' },
                        uniqueCouples: { $addToSet: '$coupleId' },
                    },
                },
            ]).toArray(),
            questionProgress.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSeen: { $sum: { $size: { $ifNull: ['$seenQuestionIds', []] } } },
                        totalSkipped: { $sum: { $size: { $ifNull: ['$skippedQuestionIds', []] } } },
                        totalAnswered: { $sum: { $size: { $ifNull: ['$answeredQuestionIds', []] } } },
                        completedSets: { $sum: { $cond: [{ $ne: [{ $ifNull: ['$completedAt', null] }, null] }, 1, 0] } },
                        startedSets: { $sum: 1 },
                    },
                },
            ]).toArray(),
            questionAnswers.aggregate(dailyActivityPipeline({
                startDate,
                dateField: '$createdAt',
                coupleField: '$coupleId',
                match: isCustom ? { createdAt: { $lte: endDate } } : {},
            })).toArray(),
            questionAnswers.aggregate([
                { $match: dateMatch },
                {
                    $group: {
                        _id: { $ifNull: ['$topicId', 'unknown'] },
                        count: { $sum: 1 },
                        users: { $addToSet: '$userId' },
                        couples: { $addToSet: '$coupleId' },
                    },
                },
                { $sort: { count: -1 } },
            ]).toArray(),
            questionAnswers.aggregate([
                { $match: dateMatch },
                {
                    $group: {
                        _id: { $ifNull: ['$format', 'choice'] },
                        count: { $sum: 1 },
                        users: { $addToSet: '$userId' },
                    },
                },
                { $sort: { count: -1 } },
            ]).toArray(),
            questionChatMessages.countDocuments(dateMatch),
            questionAnswers.find(dateMatch)
                .sort({ createdAt: -1 })
                .limit(10)
                .project({
                    topicId: 1,
                    format: 1,
                    setId: 1,
                    createdAt: 1,
                    coupleId: 1,
                })
                .toArray(),
        ]);

        const unique = uniqueStats[0] || {};
        const progress = progressStats[0] || {};
        const dailyTrend = fillMissingDates(dailyAnswersTrend, days);

        const TOPIC_TITLES = {
            relationship: 'Relationship',
            sexlove: 'Sex & Love',
            coupletherapy: 'Couple Therapy',
            longdistance: 'Long Distance',
            naughty: 'Naughty',
            gossip: 'Gossip',
            money: 'Money',
            gettoknow: 'Get To Know',
            travel: 'Travel',
            family: 'Family',
            future: 'Future',
        };

        const topics = topicBreakdown.map((item) => ({
            id: item._id,
            name: TOPIC_TITLES[item._id] || item._id,
            count: item.count,
            uniqueUsers: item.users?.length || 0,
            uniqueCouples: item.couples?.length || 0,
            share: totalAnswers > 0 ? Math.round((item.count / totalAnswers) * 1000) / 10 : 0,
        }));

        const formats = formatBreakdown.map((item) => ({
            name: item._id,
            count: item.count,
            uniqueUsers: item.users?.length || 0,
            share: totalAnswers > 0 ? Math.round((item.count / totalAnswers) * 1000) / 10 : 0,
        }));

        const answerRate = progress.totalSeen > 0
            ? Math.round((progress.totalAnswered / progress.totalSeen) * 1000) / 10
            : 0;

        const completionRate = progress.startedSets > 0
            ? Math.round((progress.completedSets / progress.startedSets) * 1000) / 10
            : 0;

        res.json({
            metrics: {
                totalAnswers,
                uniqueCouples: unique.uniqueCouples?.length || 0,
                uniqueUsers: unique.uniqueUsers?.length || 0,
                totalSeen: progress.totalSeen || 0,
                totalSkipped: progress.totalSkipped || 0,
                startedSets: progress.startedSets || 0,
                completedSets: progress.completedSets || 0,
                answerRate,
                completionRate,
                chatMessages: chatMessageCount,
            },
            trend: dailyTrend,
            topics,
            formats,
            recentAnswers: recentAnswers.map((item) => ({
                id: item._id,
                topicId: item.topicId,
                topicName: TOPIC_TITLES[item.topicId] || item.topicId,
                format: item.format,
                createdAt: item.createdAt,
            })),
            range: {
                days,
                startDate,
                endDate,
                isCustom,
            },
        });
    } catch (err) {
        console.error('Error in getQuestionEngagement:', err);
        res.status(500).json({ error: 'Failed to fetch question engagement data' });
    }
};

