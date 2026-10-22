// Next human-friendly id, e.g. EMP-0001, MGR-0001
module.exports = async (Model, field, prefix) => {
  const last = await Model.findOne().sort({ [field]: -1 }).select(field).lean();
  const n = last ? parseInt(String(last[field]).split('-')[1], 10) + 1 : 1;
  return `${prefix}-${String(n).padStart(4, '0')}`;
};
