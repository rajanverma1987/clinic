/**
 * Responds to Chrome DevTools request for /.well-known/appspecific/com.chrome.devtools.json
 * (rewritten in next.config.js). Returns empty JSON so Chrome gets 200 and the server does not log 404.
 */
export async function GET() {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
