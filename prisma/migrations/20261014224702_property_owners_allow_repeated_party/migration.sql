-- DropForeignKey
ALTER TABLE `property_owners` DROP FOREIGN KEY `property_owners_property_number_fkey`;

-- DropIndex
DROP INDEX `property_owners_property_number_party_id_key` ON `property_owners`;

-- CreateIndex
CREATE INDEX `property_owners_property_number_order_idx` ON `property_owners`(`property_number`, `order`);

-- AddForeignKey
ALTER TABLE `property_owners` ADD CONSTRAINT `property_owners_property_number_fkey` FOREIGN KEY (`property_number`) REFERENCES `properties`(`number`) ON DELETE CASCADE ON UPDATE CASCADE;
