-- TECNOMOTOS — habilita "fotos da moto" no arquivo do veículo
-- Rode isto uma vez no SQL Editor do Supabase (projeto smzxwuygeuhxlugcpxqg).
-- Seguro rodar mais de uma vez (todo comando usa "if not exists"/"on conflict").

-- 1) Coluna que guarda as URLs das fotos gerais da moto (carroceria,
--    avarias etc.), tiradas na tela de Entrada de Veículo.
alter table public.veiculos
  add column if not exists fotos_url text[] not null default '{}';

-- 2) Bucket de Storage público onde as fotos ficam guardadas.
insert into storage.buckets (id, name, public)
values ('veiculos-fotos', 'veiculos-fotos', true)
on conflict (id) do nothing;

-- 3) Políticas do bucket: qualquer usuário autenticado da oficina pode
--    enviar/ler fotos; leitura pública (o app usa link público na URL
--    salva em veiculos.fotos_url).
drop policy if exists "veiculos-fotos leitura publica" on storage.objects;
create policy "veiculos-fotos leitura publica"
  on storage.objects for select
  to public
  using (bucket_id = 'veiculos-fotos');

drop policy if exists "veiculos-fotos upload autenticado" on storage.objects;
create policy "veiculos-fotos upload autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'veiculos-fotos');
