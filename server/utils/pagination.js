// parse ?page=&limit= (limit capped at 100)
const paginate = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const pageInfo = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) || 1 });

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { paginate, pageInfo, escapeRegex };
