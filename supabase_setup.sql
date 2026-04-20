-- Criando tabelas
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'member',
  coordination TEXT
);

CREATE TABLE IF NOT EXISTS sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  quantity INTEGER DEFAULT 0,
  status TEXT
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID,
  item_name TEXT,
  user_id TEXT,
  user_name TEXT,
  type TEXT,
  quantity INTEGER,
  expected_return_date TIMESTAMPTZ,
  date TIMESTAMPTZ DEFAULT now(),
  status TEXT,
  withdrawal_photo_url TEXT,
  return_photo_url TEXT,
  return_condition TEXT,
  admin_notes TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT,
  urgency TEXT,
  description TEXT,
  status TEXT,
  author TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "to" TEXT,
  message TEXT,
  "from" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presence INTEGER,
  effort INTEGER,
  mood INTEGER,
  feeling TEXT,
  criteria JSONB,
  improvement TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ombudsman (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT,
  text TEXT,
  is_anonymous BOOLEAN DEFAUlT true,
  identification TEXT,
  status TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT,
  title TEXT,
  type TEXT,
  responsibles JSONB
);

CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT,
  description TEXT,
  author TEXT,
  rotation NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  type TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  category TEXT,
  url TEXT,
  type TEXT,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar a Extensão de Armazenamento se necessário e inserir os buckets
-- Obs: Isso geralmente pode ser feito via Interface no Supabase -> Storage -> New Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;

-- Configurar Políticas de Storage Simples (Public)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' OR bucket_id = 'documents' );

DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'photos' OR bucket_id = 'documents' );

-- Configurar Policies Públicas para todas as tabelas (Para Testes/Sem Auth Restrito)
-- Atenção: Num ambiente de prod, adicione regras de Auth corretas.
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ombudsman ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for members" ON members;
CREATE POLICY "Enable all for members" ON members FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for sectors" ON sectors;
CREATE POLICY "Enable all for sectors" ON sectors FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for inventory_items" ON inventory_items;
CREATE POLICY "Enable all for inventory_items" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for loans" ON loans;
CREATE POLICY "Enable all for loans" ON loans FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for tickets" ON tickets;
CREATE POLICY "Enable all for tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for feedbacks" ON feedbacks;
CREATE POLICY "Enable all for feedbacks" ON feedbacks FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for evaluations" ON evaluations;
CREATE POLICY "Enable all for evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for ombudsman" ON ombudsman;
CREATE POLICY "Enable all for ombudsman" ON ombudsman FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for events" ON events;
CREATE POLICY "Enable all for events" ON events FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for photos" ON photos;
CREATE POLICY "Enable all for photos" ON photos FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for notices" ON notices;
CREATE POLICY "Enable all for notices" ON notices FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for site_config" ON site_config;
CREATE POLICY "Enable all for site_config" ON site_config FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all for documents" ON documents;
CREATE POLICY "Enable all for documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- Habilitar o Realtime para as tabelas de estoque (necessário para a sincronização em tempo real do frontend)
-- Configuração de REPLICA IDENTITY
-- Se já estiverem no realtime as linhas abaixo darão erro, então pode ignorar.
-- alter publication supabase_realtime add table inventory_items;
-- alter publication supabase_realtime add table sectors;
-- alter publication supabase_realtime add table loans;
