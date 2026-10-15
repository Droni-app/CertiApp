-- CreateTable
CREATE TABLE `properties` (
    `number` VARCHAR(30) NOT NULL,
    `previous_number` VARCHAR(30) NULL,
    `zone` VARCHAR(2) NULL,
    `homologated_code` VARCHAR(20) NULL,
    `nupre` VARCHAR(20) NULL,
    `condition` VARCHAR(40) NULL,
    `registration_number` VARCHAR(30) NULL,
    `previous_registration_number` VARCHAR(30) NULL,
    `land_area` DECIMAL(14, 3) NULL,
    `built_area` DECIMAL(14, 3) NULL,
    `address` VARCHAR(200) NULL,
    `economic_destination` VARCHAR(60) NULL,
    `property_type` VARCHAR(60) NULL,
    `cadastral_value` DECIMAL(15, 2) NULL,
    `previous_cadastral_value` DECIMAL(15, 2) NULL,
    `cadastral_value_2024` DECIMAL(15, 2) NULL,
    `valid_from` DATE NULL,
    `status` VARCHAR(20) NULL,
    `matrix_number` VARCHAR(30) NULL,
    `co_ownership_coefficient` DECIMAL(9, 4) NULL,
    `is_placeholder` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `properties_previous_number_idx`(`previous_number`),
    INDEX `properties_homologated_code_idx`(`homologated_code`),
    INDEX `properties_registration_number_idx`(`registration_number`),
    PRIMARY KEY (`number`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `constructions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_number` VARCHAR(30) NOT NULL,
    `order` SMALLINT NOT NULL,
    `identifier` VARCHAR(5) NULL,
    `construction_type` VARCHAR(40) NULL,
    `domain_type` VARCHAR(20) NULL,
    `unit_type` VARCHAR(40) NULL,
    `bedrooms` SMALLINT NULL,
    `bathrooms` SMALLINT NULL,
    `commercial_units` SMALLINT NULL,
    `floors` SMALLINT NULL,
    `stratum` SMALLINT NULL,
    `use_code` SMALLINT NULL,
    `score` SMALLINT NULL,
    `typology` VARCHAR(60) NULL,
    `built_area` DECIMAL(14, 3) NULL,
    `age` INTEGER NULL,
    `useful_life` SMALLINT NULL,
    `conservation_state` DECIMAL(4, 1) NULL,
    `cadastral_value` DECIMAL(15, 2) NULL,

    INDEX `constructions_property_number_order_idx`(`property_number`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horizontal_properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_number` VARCHAR(30) NOT NULL,
    `condominium_code` VARCHAR(5) NULL,
    `total_land_area` DECIMAL(14, 3) NULL,
    `private_land_area` DECIMAL(14, 3) NULL,
    `common_land_area` DECIMAL(14, 3) NULL,
    `total_built_area` DECIMAL(14, 3) NULL,
    `private_built_area` DECIMAL(14, 3) NULL,
    `common_built_area` DECIMAL(14, 3) NULL,
    `towers` SMALLINT NULL,
    `private_units` INTEGER NULL,

    UNIQUE INDEX `horizontal_properties_property_number_key`(`property_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `administrative_sources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_number` VARCHAR(30) NOT NULL,
    `source_type` VARCHAR(60) NULL,
    `issuing_entity` VARCHAR(100) NULL,
    `office` VARCHAR(10) NULL,
    `city` VARCHAR(60) NULL,
    `document_number` VARCHAR(30) NULL,
    `document_date` DATE NULL,
    `notes` VARCHAR(255) NULL,

    INDEX `administrative_sources_property_number_idx`(`property_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `document_type` VARCHAR(30) NULL,
    `document_number` VARCHAR(30) NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `first_name` VARCHAR(60) NULL,
    `middle_name` VARCHAR(60) NULL,
    `first_surname` VARCHAR(60) NULL,
    `second_surname` VARCHAR(60) NULL,
    `business_name` VARCHAR(200) NULL,
    `sex` VARCHAR(20) NULL,
    `ethnic_group` VARCHAR(30) NULL,
    `marital_status` VARCHAR(60) NULL,

    INDEX `parties_document_type_document_number_idx`(`document_type`, `document_number`),
    INDEX `parties_full_name_idx`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property_owners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_number` VARCHAR(30) NOT NULL,
    `party_id` INTEGER NOT NULL,
    `order` INTEGER NOT NULL,
    `right_type` VARCHAR(20) NULL,
    `participation` DECIMAL(9, 4) NULL,

    INDEX `property_owners_party_id_idx`(`party_id`),
    UNIQUE INDEX `property_owners_property_number_party_id_key`(`property_number`, `party_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cadastral_procedures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_number` VARCHAR(30) NOT NULL,
    `mutation_type` VARCHAR(40) NULL,
    `resolution_number` VARCHAR(30) NULL,
    `resolution_date` DATE NULL,
    `filing_date` DATE NULL,

    INDEX `cadastral_procedures_property_number_idx`(`property_number`),
    INDEX `cadastral_procedures_resolution_number_idx`(`resolution_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `land_zones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_number` VARCHAR(30) NOT NULL,
    `order` SMALLINT NOT NULL,
    `physical_zone_1` VARCHAR(10) NULL,
    `geoeconomic_zone_1` VARCHAR(10) NULL,
    `area_1` DECIMAL(14, 3) NULL,
    `physical_zone_2` VARCHAR(10) NULL,
    `geoeconomic_zone_2` VARCHAR(10) NULL,
    `area_2` DECIMAL(14, 3) NULL,
    `land_value` DECIMAL(15, 2) NULL,

    INDEX `land_zones_property_number_order_idx`(`property_number`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_matrix_number_fkey` FOREIGN KEY (`matrix_number`) REFERENCES `properties`(`number`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `constructions` ADD CONSTRAINT `constructions_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horizontal_properties` ADD CONSTRAINT `horizontal_properties_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `administrative_sources` ADD CONSTRAINT `administrative_sources_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_owners` ADD CONSTRAINT `property_owners_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_owners` ADD CONSTRAINT `property_owners_party_id_fkey` FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cadastral_procedures` ADD CONSTRAINT `cadastral_procedures_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `land_zones` ADD CONSTRAINT `land_zones_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;
