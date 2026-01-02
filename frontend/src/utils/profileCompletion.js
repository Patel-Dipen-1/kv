/**
 * Calculate profile completion percentage
 * @param {Object} user - User object
 * @param {Array} familyMembers - Array of family members
 * @returns {Object} - { percentage, breakdown }
 */
export const calculateProfileCompletion = (user, familyMembers = []) => {
  if (!user) return { percentage: 0, breakdown: {} };

  const breakdown = {
    profilePhoto: 0,
    address: 0,
    familyMembers: 0,
    bio: 0,
  };

  // Profile photo uploaded: +20%
  if (user.profileImage) {
    breakdown.profilePhoto = 20;
  }

  // All address fields filled: +20%
  if (
    user.address?.line1 &&
    user.address?.city &&
    user.address?.state &&
    user.address?.pincode &&
    user.address?.country
  ) {
    breakdown.address = 20;
  }

  // Family members added: +30% (up to 5 members = 30%, more = 30%)
  if (familyMembers.length > 0) {
    breakdown.familyMembers = 30;
  }

  // Bio/additional info: +30%
  // Check if user has filled additional information
  const hasAdditionalInfo =
    user.qualification ||
    user.occupationTitle ||
    user.companyOrBusinessName ||
    user.position ||
    user.committeeBio;

  if (hasAdditionalInfo) {
    breakdown.bio = 30;
  }

  const percentage = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    percentage,
    breakdown,
  };
};

