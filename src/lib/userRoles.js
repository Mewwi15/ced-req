export function getRegistrationRoles(email) {
  const isFteEmail =
    typeof email === "string" &&
    /^[^@\s]+@fte\.kmutnb\.ac\.th$/i.test(email.trim());

  return [isFteEmail ? "admin" : "student"];
}
