/**
 * Calculates priority based on complaintCount:
 * - 1-2: low
 * - 3-5: medium
 * - 6-9: high
 * - 10+: critical
 * 
 * @param {number} complaintCount 
 * @returns {'low'|'medium'|'high'|'critical'}
 */
const calculatePriority = (complaintCount) => {
  const count = Number(complaintCount) || 1;
  if (count >= 10) return 'critical';
  if (count >= 6) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
};

module.exports = { calculatePriority };

