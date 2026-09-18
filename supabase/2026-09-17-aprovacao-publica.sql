-- Aprovação pública de orçamento (link enviado por WhatsApp) — guarda
-- quem aprovou, o CPF de quem assinou e quando, pra ficar registrado
-- junto da OS e sair já preenchido no PDF baixado depois. Sem essas
-- colunas, o botão "Aprovar" na página pública continua funcionando
-- (o servidor tenta gravar com esses campos e, se a coluna não existir
-- ainda, grava só o status "aprovado" mesmo assim) — mas rodar isso
-- aqui uma vez guarda o nome, CPF e a data de quem confirmou, e é o
-- que faz o PDF sair com a assinatura já preenchida em vez da linha
-- em branco.
alter table ordens_servico add column if not exists aprovado_por text;
alter table ordens_servico add column if not exists aprovado_cpf text;
alter table ordens_servico add column if not exists aprovado_em timestamptz;
