// SHA-256 hash of the admin password.
// To change your password:
//   1. Open browser console and run:
//        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tu-nueva-clave'));
//        console.log([...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''));
//   2. Replace ADMIN_HASH below with the output.
//
// Default password: UCIPadmin2025!
const ADMIN_HASH =
  "0506909f5d5f0fcf84c0996af7612e834df1a12b94663211d78dd2d7724fd70f";

async function sha256(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password) {
  const hash = await sha256(password);
  return hash === ADMIN_HASH;
}
