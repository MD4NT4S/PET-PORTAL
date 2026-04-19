import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, bcc, from_name } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')

    // IMPORTANTE: Enquanto o domínio não for validado no Resend, 
    // PRECISAMOS usar o e-mail abaixo, senão o Resend bloqueia o envio.
    // O Resend só enviará para o e-mail do próprio dono da conta nesta fase.
    const fromEmail = "onboarding@resend.dev"; 

    console.log(`[Resend] Tentando enviar para: ${to}`);

    const bccArray = bcc 
      ? (Array.isArray(bcc) ? bcc : bcc.split(',')).map(e => e.trim()).filter(e => e !== '' && e !== (Array.isArray(to) ? to[0] : to))
      : [];

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${from_name || 'Portal PET'} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        bcc: bccArray.length > 0 ? bccArray : undefined,
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      console.error("[Resend Error]", resData);
      return new Response(JSON.stringify({ error: resData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: res.status,
      })
    }

    return new Response(JSON.stringify(resData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[Function Error]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
