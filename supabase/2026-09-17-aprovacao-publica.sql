-- Aprovação pública de orçamento (link enviado por WhatsApp) — guarda
-- quem aprovou e quando, pra ficar registrado junto da OS. Sem essas
-- colunas, o botão "Aprovar" na página pública continua funcionando
-- (o servidor tenta gravar com esses dois campos e, se a coluna não
-- existir ainda, grava só o status "aprovado" mesmo assim) — mas
-- rodar isso aqui uma vez guarda o nome e a data de quem confirmou.
alter table ordens_servico add column if not exists aprovado_por text;
alter table ordens_servico add column if not exists aprovado_em timestamptz;
