-- #UP
ALTER TABLE propriedade ADD COLUMN id_imovel INT UNSIGNED NOT NULL;
ALTER TABLE propriedade ADD COLUMN id_proprietario INT UNSIGNED NOT NULL;
ALTER TABLE propriedade ADD COLUMN area_media INT;

ALTER TABLE propriedade ADD CONSTRAINT propriedade_imovel_fk FOREIGN KEY (id_imovel) REFERENCES imovel(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE usuario ADD COLUMN id_propriedade INT UNSIGNED;

-- #DOWN
ALTER TABLE usuario DROP COLUMN id_propriedade;
ALTER TABLE propriedade DROP FOREIGN KEY propriedade_imovel_fk;
ALTER TABLE propriedade DROP COLUMN id_imovel;
ALTER TABLE propriedade DROP COLUMN id_proprietario;
ALTER TABLE propriedade DROP COLUMN area_media;

