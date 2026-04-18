import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, bcc, from_name } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY')
    }

    // Configuração do remetente. 
    // Se você não tiver um domínio validado no Resend, 
    // precisará usar "PET Hub <onboarding@resend.dev>" e só poderá enviar para você mesmo.
    // Assim que validar o domínio no Resend, você deve alterar o e-mail abaixo.
    const fromEmail = "contato@petcivil.site"; // Fallback ou padrão do seu domínio
    const fallbackFrom = "PET Hub <onboarding@resend.dev>";

    console.log(`Enviando e-mail para: ${to}`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from_name ? `${from_name} <${fromEmail}>` : fallbackFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : bcc.split(',')) : undefined,
      }),
    })

    const resData = await res.json()

    if (res.ok) {
      return new Response(JSON.stringify(resData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      return new Response(JSON.stringify({ error: resData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: res.status,
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
