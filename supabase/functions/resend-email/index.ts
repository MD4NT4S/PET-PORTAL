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
    const { to, subject, html, bcc, from_name, template } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')

    // Domínio verificado! Agora podemos enviar para qualquer e-mail.
    const fromEmail = "sistema@petcivil.site"; 

    // Log inicial
    console.log(`[Resend] Nova solicitação de envio. To: ${JSON.stringify(to)} | Template: ${template?.id || 'Nenhum'}`);

    const bccArray = bcc 
      ? (Array.isArray(bcc) ? bcc : bcc.split(',')).map(e => e.trim()).filter(e => e !== '')
      : [];

    const payload: any = {
      from: `${from_name || 'Portal PET'} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
    }

    if (bccArray.length > 0) {
      payload.bcc = bccArray;
    }

    if (template && template.id) {
      console.log(`[Resend] Usando template: ${template.id}`);
      payload.template = {
        id: template.id.trim(),
        variables: template.variables || {}
      };
      // Quando usa template, subject é opcional (substitui o do template se enviado)
      if (subject) payload.subject = subject;
    } else {
      console.log(`[Resend] Usando HTML padrão.`);
      payload.subject = subject || "Aviso Portal PET";
      payload.html = html || "";
    }

    console.log("[Resend] Payload Final:", JSON.stringify(payload, null, 2));

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const resData = await res.json()

    if (!res.ok) {
      const errorText = JSON.stringify(resData);
      console.error(`[Resend Error] Status: ${res.status} | Body: ${errorText}`);
      return new Response(errorText, {
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
