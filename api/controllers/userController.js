import mongoose from 'mongoose';
import { getCountryForTimezone } from 'countries-and-timezones';

const clampInteger = (value, fallback, minimum, maximum) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, minimum), maximum);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseUserId = (value) => (
    mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value
);

export const getUsers = async (req, res) => {
    try {
        const page = clampInteger(req.query.page, 1, 1, 10_000);
        const limit = clampInteger(req.query.limit, 15, 1, 100);
        const search = String(req.query.search || '').trim().slice(0, 100);
        const skip = (page - 1) * limit;

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Build search query
        const escapedSearch = escapeRegex(search);
        const query = escapedSearch ? {
            $or: [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { email: { $regex: escapedSearch, $options: 'i' } }
            ]
        } : {};

        // Execute queries in parallel
        const [userList, total] = await Promise.all([
            users.find(query, {
                projection: {
                    name: 1,
                    avatar: 1,
                    isPremium: 1,
                    platform: 1,
                    partnerId: 1,
                    connectionDate: 1,
                    timezone: 1,
                    appVersion: 1,
                    lastSeen: 1,
                    createdAt: 1,
                    'onboarding.completedAt': 1
                }
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            users.countDocuments(query)
        ]);

        const usersWithCountry = userList.map((user) => {
            const country = user.timezone ? getCountryForTimezone(user.timezone) : null;
            return {
                ...user,
                country: country ? { code: country.id, name: country.name } : null,
            };
        });

        res.json({
            users: usersWithCountry,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Fetch Users Error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const db = mongoose.connection.db;
        const userId = parseUserId(id);
        
        const user = await db.collection('users').findOne(
            { _id: userId },
            {
                projection: {
                    email: 1,
                    name: 1,
                    nickname: 1,
                    avatar: 1,
                    gender: 1,
                    age: 1,
                    partnerId: 1,
                    connectionDate: 1,
                    onboarding: 1,
                    timezone: 1,
                    preferredLanguage: 1,
                    platform: 1,
                    appVersion: 1,
                    appBuildNumber: 1,
                    deviceInfoUpdatedAt: 1,
                    currentMood: 1,
                    topicProgress: 1,
                    lastSeen: 1,
                    isOnline: 1,
                    isPremium: 1,
                    premiumExpiresAt: 1,
                    premiumPlan: 1,
                    premiumWillRenew: 1,
                    premiumCancelledAt: 1,
                    locationSharingEnabled: 1,
                    widgetStatus: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch partner details if partnerId exists
        let partnerData = null;
        if (user.partnerId) {
            const partnerId = parseUserId(user.partnerId);
            partnerData = await db.collection('users').findOne(
                { _id: partnerId },
                { projection: { name: 1, email: 1, platform: 1, createdAt: 1 } }
            );
        }

        const activeCouple = await db.collection('couples').findOne({
            status: 'active',
            $or: [{ partner1: userId }, { partner2: userId }]
        });

        // Fetch recent activities and true totals in parallel.
        const [
            tictactoes,
            wordles,
            jigsawpuzzles,
            dailyanswers,
            chats,
            questionAnswersV2,
            moodLogs,
            memories,
            activityTotals,
            streak
        ] = await Promise.all([
            db.collection('tictactoes').find({ 
                $or: [{ creatorId: userId }, { partnerId: userId }] 
            }).sort({ createdAt: -1 }).limit(10).toArray(),
            db.collection('wordles').find({ 
                $or: [{ creatorId: userId }, { partnerId: userId }] 
            }).sort({ createdAt: -1 }).limit(10).toArray(),
            db.collection('jigsawpuzzles').find({ 
                $or: [{ creatorId: userId }, { partnerId: userId }] 
            }).sort({ createdAt: -1 }).limit(10).toArray(),
            db.collection('dailyanswers').find({ userId }).sort({ createdAt: -1 }).limit(10).toArray(),
            db.collection('chats').find({
                $or: [{ partner1: userId }, { partner2: userId }]
            }).sort({ lastMessageAt: -1 }).limit(10).toArray(),
            db.collection('questionanswerv2').find({ userId })
                .sort({ createdAt: -1 }).limit(10).toArray(),
            db.collection('moodlogs').find({ userId })
                .sort({ updatedAt: -1 }).limit(10).toArray(),
            activeCouple
                ? db.collection('memories').find({ coupleId: activeCouple._id, deletedAt: null })
                    .sort({ createdAt: -1 }).limit(10).toArray()
                : [],
            Promise.all([
                db.collection('chats').countDocuments({
                    $or: [{ partner1: userId }, { partner2: userId }]
                }),
                db.collection('questionanswerv2').countDocuments({ userId }),
                db.collection('dailyanswers').countDocuments({ userId, isComplete: true }),
                db.collection('tictactoes').countDocuments({
                    $or: [{ creatorId: userId }, { partnerId: userId }],
                    completedAt: { $ne: null }
                }),
                db.collection('wordles').countDocuments({
                    $or: [{ creatorId: userId }, { partnerId: userId }],
                    completedAt: { $ne: null }
                }),
                db.collection('jigsawpuzzles').countDocuments({
                    $or: [{ creatorId: userId }, { partnerId: userId }],
                    solvedAt: { $ne: null }
                }),
                db.collection('moodlogs').countDocuments({ userId }),
                activeCouple
                    ? db.collection('memories').countDocuments({ coupleId: activeCouple._id, deletedAt: null })
                    : 0
            ]),
            activeCouple
                ? db.collection('couplestreaks').findOne({ coupleId: activeCouple._id })
                : null
        ]);

        res.json({
            ...user,
            partnerData,
            couple: activeCouple ? {
                _id: activeCouple._id,
                connectionDate: activeCouple.connectionDate,
                relationshipStartDate: activeCouple.relationshipStartDate,
                status: activeCouple.status
            } : null,
            streak: streak ? {
                current: streak.currentStreak || 0,
                longest: streak.longestStreak || 0,
                lastFullHeartDate: streak.lastFullHeartDate || null
            } : null,
            totals: {
                conversations: activityTotals[0],
                questionAnswers: activityTotals[1],
                completedRituals: activityTotals[2],
                completedGames: activityTotals[3] + activityTotals[4] + activityTotals[5],
                moodUpdates: activityTotals[6],
                memories: activityTotals[7]
            },
            activities: {
                answers: [
                    ...chats.map(chat => ({
                        ...chat,
                        type: 'Answer Session',
                        text: chat.questionText,
                        answer: chat.messages?.find(m =>
                            m.senderId.toString() === userId.toString() && m.messageType === 'answer'
                        )?.content || chat.lastMessagePreview,
                        createdAt: chat.lastMessageAt || chat.createdAt
                    })),
                    ...questionAnswersV2.map(answer => ({
                        ...answer,
                        type: 'Question V2',
                        text: answer.prompt,
                        questionCategory: answer.topicId,
                        createdAt: answer.createdAt
                    }))
                ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                games: [
                    ...tictactoes.map(g => ({ 
                        ...g, 
                        type: 'TicTacToe', 
                        text: 'Match Played (Completed)'
                    })),
                    ...wordles.map(g => ({ 
                        ...g, 
                        type: 'Wordle', 
                        text: g.status === 'won' 
                            ? (g.winner?.toString() === userId.toString() ? `Victory! Guessed: ${g.secretWord}` : `Partner guessed: ${g.secretWord}`) 
                            : g.status === 'lost' ? `Failed to guess: ${g.secretWord}` : 'Active guessing session...'
                    })),
                    ...jigsawpuzzles.map(g => ({ 
                        ...g, 
                        type: 'Jigsaw', 
                        text: g.status === 'solved' ? 'Victory! Completed the puzzle.' : 'Assembling the pieces...' 
                    })),
                    ...dailyanswers.map(d => ({ 
                        ...d, 
                        type: 'Daily Challenge', 
                        text: d.isComplete ? 'Challenge Completed! Perfect sync.' : `In Progress: ${d.completedCount}/${d.totalTasks} tasks` 
                    })),
                    ...moodLogs.map(m => ({
                        ...m,
                        type: 'Mood Update',
                        text: `${m.mood?.emoji || ''} ${m.mood?.label || 'Mood updated'}`.trim(),
                        createdAt: m.updatedAt
                    })),
                    ...memories.map(m => ({
                        ...m,
                        type: 'Memory',
                        text: m.title || m.caption || 'Memory added'
                    }))
                ].sort((a, b) => new Date(b.createdAt || b.completedAt || b.answeredAt || b.solvedAt) - new Date(a.createdAt || a.completedAt || a.answeredAt || a.solvedAt))
            }
        });
    } catch (err) {
        console.error('Fetch User Details Error:', err);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};
