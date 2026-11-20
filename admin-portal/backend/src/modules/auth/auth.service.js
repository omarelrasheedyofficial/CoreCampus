export function getCurrentUser(user) {
  return {
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    studentProfile: user.studentProfile,
    staffProfile: user.staffProfile,
  };
}
