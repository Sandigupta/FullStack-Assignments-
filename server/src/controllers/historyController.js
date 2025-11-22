import { Generation, Language } from '../models/index.js';

export const getHistory = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const languageKey = req.query.language;

    const offset = (page - 1) * limit;

    try {
        const whereClause = {};

        if (languageKey) {
            const lang = await Language.findOne({ where: { key: languageKey } });
            if (lang) {
                whereClause.languageId = lang.id;
            }
        }

        const { count, rows } = await Generation.findAndCountAll({
            where: whereClause,
            include: [{
                model: Language,
                attributes: ['key', 'name']
            }],
            limit: Math.min(limit, 100), // Max limit 100
            offset,
            order: [['createdAt', 'DESC']]
        });

        // Format response
        const data = rows.map(row => ({
            id: row.id,
            prompt: row.prompt,
            code: row.code,
            language: row.Language.key,
            createdAt: row.createdAt
        }));

        res.json({
            data,
            meta: {
                page,
                limit,
                totalItems: count,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
