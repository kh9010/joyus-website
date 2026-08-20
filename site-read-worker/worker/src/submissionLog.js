// ---------------------------------------------------------------------------
// SUBMISSION LOG — STUB.
//
// Every submission (url + email + slug + outcome) is meant to land in the same
// Firestore collection the rest of the Joyus site writes to, so the reads a
// visitor generates are reachable from the same place as everything else.
//
// TODO: implement the Firestore write. Sketch, so the shape is settled before
// anyone picks it up:
//   - Auth: a service-account JWT signed with WebCrypto (RS256) exchanged at
//     https://oauth2.googleapis.com/token for an access token, cached in KV
//     until ~5 minutes before expiry. The googleapis SDK does not run on
//     Workers; the REST API does.
//   - Write: POST https://firestore.googleapis.com/v1/projects/{PROJECT}/
//     databases/(default)/documents/site_reads?documentId={slug}
//     with the document body below converted to Firestore's typed-value
//     encoding ({stringValue}/{timestampValue}/{booleanValue}).
//   - Secrets needed: FIRESTORE_PROJECT_ID, FIRESTORE_CLIENT_EMAIL,
//     FIRESTORE_PRIVATE_KEY (wrangler secret put).
//   - Call it from ctx.waitUntil() so a logging failure never delays or fails
//     the visitor's read.
//
// Until then this records nothing and returns quietly. It deliberately does not
// throw: a missing log must never cost a visitor their read.
// ---------------------------------------------------------------------------

/**
 * @param {object} env
 * @param {{slug:string,url:string,email:string|null,status:string,attempts:number,gate:string,created_at:string}} entry
 */
export async function logSubmission(env, entry) {
  // The document this will write, kept here so the field names are agreed
  // before the implementation lands.
  const document = {
    slug: entry.slug,
    site_url: entry.url,
    email: entry.email || null,
    status: entry.status,
    gate: entry.gate,
    attempts: entry.attempts,
    created_at: entry.created_at,
    source: 'site-read-worker',
  };

  // TODO(firestore): replace this with the REST write described above.
  if (env && env.SUBMISSION_LOG_DEBUG === 'true') {
    console.log('[submission-log stub]', JSON.stringify(document));
  }
  return { written: false, reason: 'firestore write not implemented (stub)' };
}
