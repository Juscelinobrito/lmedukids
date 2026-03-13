ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);

COMMENT ON COLUMN public.users.whatsapp IS 'Telefone/WhatsApp do usuário em formato numérico';
