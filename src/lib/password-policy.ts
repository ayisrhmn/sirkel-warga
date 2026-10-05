// Basic checks against passwords that are guessed first. Length (8 to 128) is
// checked by each caller; this catches the obvious bad choices. Pure, so the
// same rules run in the browser for instant feedback and again on the server.
const COMMON = new Set([
  "password", "password1", "password12", "password123", "passw0rd",
  "12345678", "123456789", "1234567890", "12341234", "123123123", "87654321",
  "11111111", "00000000", "qwertyui", "qwerty123", "qwertyuiop", "abcdefgh", "abcd1234",
  "iloveyou", "admin123", "admin1234", "welcome1", "letmein1",
  "indonesia", "indonesia1", "indonesia123", "sirkel123", "rahasia123", "katasandi",
]);

export const WEAK_PASSWORD_MESSAGE =
  "Password terlalu mudah ditebak. Pakai kombinasi yang lebih panjang atau acak.";

export function passwordProblem(password: string, username?: string): string | null {
  const lower = password.toLowerCase();
  const user = username?.toLowerCase();
  const sequence = "01234567890";
  const weak =
    COMMON.has(lower) ||
    /^(.)\1+$/.test(password) || // 11111111, aaaaaaaa
    sequence.includes(lower) || // 23456789
    [...sequence].reverse().join("").includes(lower) || // 98765432
    (user !== undefined && user.length >= 3 && (lower === user || (user.length >= 5 && lower.includes(user))));
  return weak ? WEAK_PASSWORD_MESSAGE : null;
}
