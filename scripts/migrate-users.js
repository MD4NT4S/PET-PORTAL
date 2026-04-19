
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Função simples para carregar o .env sem depender do pacote dotenv
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("❌ ERRO: Faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no arquivo .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function migrate() {
    console.log("🚀 Iniciando migração de usuários para Supabase Auth...");

    // 1. Pegar todos os membros atuais
    const { data: members, error: fetchError } = await supabase
        .from('members')
        .select('*');

    if (fetchError) {
        console.error("❌ Erro ao buscar membros:", fetchError.message);
        return;
    }

    console.log(`📋 Encontrados ${members.length} membros para migrar.`);

    for (const member of members) {
        console.log(`\n👤 Processando: ${member.name} (${member.email})`);

        // A senha será o que estiver no campo password, ou uma padrão se estiver vazio
        const password = member.password || 'PET123@hub';

        // 2. Criar usuário no Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: member.email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: member.name,
                role: member.role
            }
        });

        if (authError) {
            if (authError.message.includes("already registered")) {
                console.log(`⚠️ Usuário já existe no Auth. Pulando...`);
            } else {
                console.error(`❌ Erro ao criar usuário ${member.email}:`, authError.message);
            }
            continue;
        }

        console.log(`✅ Usuário criado no Auth com sucesso!`);
    }

    console.log("\n✨ Migração concluída!");
}

migrate();
