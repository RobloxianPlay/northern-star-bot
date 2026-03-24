module.exports = (client) => {
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
    const unverifiedRoleId = process.env.UNVERIFIED_ROLE_ID;

    if (!verifiedRoleId || !unverifiedRoleId) return;

    const hadVerified = oldMember.roles.cache.has(verifiedRoleId);
    const hasVerified = newMember.roles.cache.has(verifiedRoleId);
    const hasUnverified = newMember.roles.cache.has(unverifiedRoleId);

    // Trigger only when Verified role is added
    if (!hadVerified && hasVerified && hasUnverified) {
      try {
        await newMember.roles.remove(unverifiedRoleId);
        console.log(`[RoleSync] Removed Unverified role from ${newMember.user.tag}`);
      } catch (error) {
        console.error(`[RoleSync] Error removing Unverified role from ${newMember.user.tag}:`, error);
      }
    }
  });
};
