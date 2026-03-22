import mongoose from 'mongoose';

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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
        const user = await db.collection('users').findOne({ _id: id.length === 24 ? new mongoose.Types.ObjectId(id) : id });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Potential addition: count user-related data (answers, couples, etc.)
        res.json(user);
    } catch (err) {
        console.error('Fetch User Details Error:', err);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};
