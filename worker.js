// Cloudflare Worker — handles /api/subscribe, static assets served automatically

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      if (request.method === 'POST') {
        return handleSubscribe(request, env);
      }
      return jsonResponse(405, { ok: false, message: 'Method not allowed.' });
    }

    // All other routes: fall through to static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleSubscribe(request, env) {
  const apiKey = env.SENDER_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { ok: false, message: 'Server misconfiguration.' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, message: 'Invalid request body.' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(422, { ok: false, message: 'Please enter a valid email address.' });
  }

  const senderBody = { email, trigger_automation: true };
  const groupId = env.SENDER_GROUP_ID;
  if (groupId) {
    senderBody.groups = [groupId];
  }

  try {
    const senderRes = await fetch('https://api.sender.net/v2/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(senderBody),
    });

    if (senderRes.ok) {
      return jsonResponse(200, { ok: true, message: "You're on the list! We'll be in touch." });
    }

    const senderError = await senderRes.json().catch(() => ({}));

    if (senderRes.status === 422) {
      return jsonResponse(422, {
        ok: false,
        message: senderError.message || 'That email could not be added. Please try another.',
      });
    }

    console.error('Sender.net error:', senderRes.status, senderError);
    return jsonResponse(502, { ok: false, message: 'Signup service temporarily unavailable.' });

  } catch (err) {
    console.error('Fetch to Sender.net failed:', err);
    return jsonResponse(502, { ok: false, message: 'Signup service temporarily unavailable.' });
  }
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
