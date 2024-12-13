-- #UP
ALTER TABLE propriedade ADD COLUMN id_imovel INT UNSIGNED NOT NULL;
ALTER TABLE propriedade ADD COLUMN id_proprietario INT UNSIGNED NOT NULL;
ALTER TABLE propriedade ADD COLUMN area_media INT;

-- #DOWN
ALTER TABLE propriedade DROP COLUMN id_imovel;
ALTER TABLE propriedade DROP COLUMN id_proprietario;
ALTER TABLE propriedade DROP COLUMN area_media;

