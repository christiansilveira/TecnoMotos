-- ══════════════════════════════════════════════════════════════════════
-- TECNOMOTOS — esquema mínimo para o Supabase
-- Rode isto inteiro no SQL Editor do seu projeto Supabase (uma vez só)
-- antes de colocar as variáveis de ambiente reais no Vercel. Sem isso,
-- o app não tem em que consultar e as páginas voltam vazias/erro.
-- ══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  criado_em timestamptz not null default now()
);

create table if not exists veiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null,
  marca text,
  modelo text,
  ano int,
  km_atual int,
  documento text,
  cliente_id uuid references clientes (id),
  criado_em timestamptz not null default now()
);

create table if not exists ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero int generated always as identity (start with 1044),
  status text not null default 'diagnostico',
  km_entrada int,
  relato_cliente text,
  diagnostico text,
  valor_pecas numeric not null default 0,
  valor_servicos numeric not null default 0,
  valor_desconto numeric not null default 0,
  valor_total numeric not null default 0,
  veiculo_id uuid references veiculos (id),
  cliente_id uuid references clientes (id),
  aberta_em timestamptz not null default now(),
  finalizada_em timestamptz,
  entregue_em timestamptz
);

create table if not exists os_itens (
  id uuid primary key default gen_random_uuid(),
  os_id uuid references ordens_servico (id) on delete cascade,
  tipo text not null check (tipo in ('peca', 'servico')),
  descricao text not null,
  quantidade numeric not null default 1,
  valor_unit numeric not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sku text,
  codigo_barras text,
  preco_venda numeric not null default 0,
  preco_custo numeric not null default 0,
  estoque_min numeric not null default 0,
  unidade text not null default 'UN',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Usado pela Entrada por Nota (XML) para achar peça já cadastrada pelo
-- código de barras/EAN antes de criar duplicata.
create index if not exists idx_produtos_codigo_barras on produtos (codigo_barras) where codigo_barras is not null;

create table if not exists estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references produtos (id),
  tipo text not null check (tipo in ('entrada_nf', 'entrada_manual', 'saida_os', 'saida_venda', 'devolucao', 'ajuste')),
  quantidade numeric not null,
  custo_unit numeric,
  criado_em timestamptz not null default now()
);

-- View de estoque: saldo e situação calculados a partir dos movimentos.
-- É o que a página /estoque consulta (vw_estoque).
create or replace view vw_estoque as
select
  p.*,
  coalesce(m.saldo, 0) as saldo,
  case
    when coalesce(m.saldo, 0) <= 0 then 'zerado'
    when coalesce(m.saldo, 0) <= p.estoque_min then 'critico'
    else 'ok'
  end as situacao
from produtos p
left join (
  select
    produto_id,
    sum(case when tipo in ('saida_os', 'saida_venda') then -abs(quantidade) else abs(quantidade) end) as saldo
  from estoque_movimentos
  group by produto_id
) m on m.produto_id = p.id;

-- ── Row Level Security ──────────────────────────────────────────────
-- Agora que o app tem tela de login (AuthGate + Supabase Auth, com
-- criação de conta travada pelo código da oficina em
-- app/api/criar-conta), só quem está autenticado consegue ler ou
-- gravar. Se em algum momento este script já tiver rodado antes com a
-- política antiga "Acesso liberado (sem login ainda)", o `drop policy`
-- abaixo remove ela antes de criar a nova — rodar este arquivo de novo
-- é seguro.
alter table clientes enable row level security;
alter table veiculos enable row level security;
alter table ordens_servico enable row level security;
alter table os_itens enable row level security;
alter table produtos enable row level security;
alter table estoque_movimentos enable row level security;

drop policy if exists "Acesso liberado (sem login ainda)" on clientes;
drop policy if exists "Acesso liberado (sem login ainda)" on veiculos;
drop policy if exists "Acesso liberado (sem login ainda)" on ordens_servico;
drop policy if exists "Acesso liberado (sem login ainda)" on os_itens;
drop policy if exists "Acesso liberado (sem login ainda)" on produtos;
drop policy if exists "Acesso liberado (sem login ainda)" on estoque_movimentos;

drop policy if exists "Só quem está logado" on clientes;
drop policy if exists "Só quem está logado" on veiculos;
drop policy if exists "Só quem está logado" on ordens_servico;
drop policy if exists "Só quem está logado" on os_itens;
drop policy if exists "Só quem está logado" on produtos;
drop policy if exists "Só quem está logado" on estoque_movimentos;

create policy "Só quem está logado" on clientes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Só quem está logado" on veiculos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Só quem está logado" on ordens_servico for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Só quem está logado" on os_itens for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Só quem está logado" on produtos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Só quem está logado" on estoque_movimentos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Realtime: liga a atualização automática do quadro de Ordens de Serviço
alter publication supabase_realtime add table ordens_servico;
