-- Fotos do problema encontrado, anexadas ao diagnóstico da OS — pedido
-- do Christian: "quero que na OS, para mandar o diagnóstico e a OS pra
-- assinar, tenha um campo pra poder colocar o que foi o problema, por
-- foto se necessário". Sem rodar isso, o campo de texto do diagnóstico
-- continua funcionando normalmente (o app tenta gravar com a coluna de
-- fotos e, se ela não existir, grava só o texto) — só não vai ser
-- possível anexar fotos até essa migração rodar.

alter table ordens_servico add column if not exists diagnostico_fotos text[];

-- Bucket público (mesmo padrão do "veiculos-fotos", da Sessão 3): as
-- fotos do diagnóstico ficam acessíveis por URL direta, tanto no PDF
-- baixado quanto na página pública de aprovação que o cliente assina —
-- não faz sentido exigir login só pra ver uma foto que já está sendo
-- mandada pro próprio cliente pelo WhatsApp.
insert into storage.buckets (id, name, public)
values ('os-diagnostico-fotos', 'os-diagnostico-fotos', true)
on conflict (id) do nothing;

drop policy if exists "Leitura pública das fotos de diagnóstico" on storage.objects;
create policy "Leitura pública das fotos de diagnóstico"
on storage.objects for select
using (bucket_id = 'os-diagnostico-fotos');

drop policy if exists "Upload autenticado de fotos de diagnóstico" on storage.objects;
create policy "Upload autenticado de fotos de diagnóstico"
on storage.objects for insert
to authenticated
with check (bucket_id = 'os-diagnostico-fotos');
