import mongoose from 'mongoose';
import { getCountryForTimezone } from 'countries-and-timezones';

const REPORT_TIMEZONE = '+05:30';
const DAY_MS = 24 * 60 * 60 * 1000;
const SUMMARY_CACHE_TTL_MS = 60 * 1000;
const summaryCache = new Map();

const clampDays = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 28;
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
        const country = timezone === 'unknown' ? null : getCountryForTimezone(timezone);
        const key = country?.id || 'unknown';
        const current = countries.get(key) || {
            code: country?.id || null,
            name: country?.name || 'Unknown country',
            value: 0,
            timezones: new Set(),
        };

        current.value += item.count || 0;
        if (timezone !== 'unknown') current.timezones.add(timezone);
        countries.set(key, current);
    });

    return Array.from(countries.values())
        .map((item) => ({
            code: item.code,
            name: item.name,
            value: item.value,
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
        const moodLogs = db.collection('moodlogs');
        const memories = db.collection('memories');
        const subscriptions = db.collection('subscriptions');
        const callDiagnostics = db.collection('calldiagnostics');

        const [
            totalUsers,
            activeCouples,
            unpairedCouples,
            premiumUsers,
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
            ]),
            Promise.all([
                tictactoes.countDocuments({ completedAt: { $gte: todayStart } }),
                wordles.countDocuments({ completedAt: { $gte: todayStart } }),
                puzzles.countDocuments({ createdAt: { $gte: todayStart } }),
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
                + (puzzleCounts.get(item.date) || 0),
        }));

        const todayEngagements = engagementTrendWithBreakdown.at(-1)?.count || 0;
        const onboarding = onboardingCounts[0] || {};
        const ritualStates = Object.fromEntries(ritualStateCounts.map((item) => [item._id, item.count]));
        const ritualTotal = ritualStateCounts.reduce((sum, item) => sum + item.count, 0);
        const progress = questionProgressSummary[0] || {};
        const streak = streakSummary[0] || {};
        const featureNames = ['Question chats', 'Question answers', 'Mutual rituals', 'Mood updates', 'Memories', 'Tic-Tac-Toe', 'Wordle', 'Puzzles created'];
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
