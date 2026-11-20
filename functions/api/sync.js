export async function onRequestPost({ request, env }) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (!env.GAS_WEB_APP_URL || !env.GAS_API_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Cloud sync belum dikonfigurasi. Tambahkan GAS_WEB_APP_URL dan GAS_API_SECRET di Cloudflare.' }), { status: 503, headers });
  }
  let input;
  try { input = await request.json(); } catch { return new Response(JSON.stringify({ ok:false, error:'JSON request tidak valid.' }), {status:400,headers}); }
  const action = ['get','save','health'].includes(input.action) ? input.action : null;
  if (!action) return new Response(JSON.stringify({ok:false,error:'Aksi tidak dikenal.'}),{status:400,headers});
  try {
    const upstream = await fetch(env.GAS_WEB_APP_URL, {
      method: 'POST', redirect: 'follow', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: env.GAS_API_SECRET, action, payload: input.payload || {} })
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Respons Google Apps Script bukan JSON. Periksa URL deployment Web App.'); }
    return new Response(JSON.stringify(data), { status: data.ok || data.conflict ? 200 : 400, headers });
  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:String(err.message || err)}),{status:502,headers});
  }
}
