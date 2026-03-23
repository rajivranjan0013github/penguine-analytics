import mongoose from 'mongoose';

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Build search query
        const query = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Execute queries in parallel
        const [userList, total] = await Promise.all([
            users.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            users.countDocuments(query)
        ]);

        res.json({
            users: userList,
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
        const userId = id.length === 24 ? new mongoose.Types.ObjectId(id) : id;
        
        const user = await db.collection('users').findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch partner details if partnerId exists
        let partnerData = null;
        if (user.partnerId) {
            const partnerId = user.partnerId.length === 24 ? new mongoose.Types.ObjectId(user.partnerId) : user.partnerId;
            partnerData = await db.collection('users').findOne(
                { _id: partnerId },
                { projection: { name: 1, email: 1, platform: 1, createdAt: 1 } }
            );
        }

        // Fetch user activities in parallel
        const [tictactoes, wordles, jigsawpuzzles, dailyanswers, chats] = await Promise.all([
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
            }).sort({ lastMessageAt: -1 }).limit(20).toArray()
        ]);

        res.json({
            ...user,
            partnerData,
            activities: {
                answers: chats.map(chat => ({
                    ...chat,
                    type: 'Answer Session',
                    text: chat.questionText,
                    // Find the user's specific answer in the messages
                    answer: chat.messages?.find(m => 
                        m.senderId.toString() === userId.toString() && m.messageType === 'answer'
                    )?.content || chat.lastMessagePreview,
                    createdAt: chat.lastMessageAt || chat.createdAt
                })),
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
                    }))
                ].sort((a, b) => new Date(b.createdAt || b.completedAt || b.answeredAt || b.solvedAt) - new Date(a.createdAt || a.completedAt || a.answeredAt || a.solvedAt))
            }
        });
    } catch (err) {
        console.error('Fetch User Details Error:', err);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};
