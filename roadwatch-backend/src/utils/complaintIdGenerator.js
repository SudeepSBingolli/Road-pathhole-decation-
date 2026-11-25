const Counter = require('../models/Counter');

/**
 * Atomically generates the next complaint ID formatted as RW-YYYY-XXXX (e.g. RW-2026-0001)
 * @returns {Promise<string>}
 */
const generateComplaintId = async () => {
  const currentYear = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `RW-${currentYear}-${paddedSeq}`;
};

module.exports = { generateComplaintId };

