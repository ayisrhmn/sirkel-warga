// Synthetic address: Better Auth requires an email, but pengurus log in with a
// username. It is never used to send mail.
export const usernameToEmail = (username: string) =>
  `${username}@users.sirkel.local`;
