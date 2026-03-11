-- AlterTable
ALTER TABLE `generations` ADD COLUMN `aiModelId` VARCHAR(191) NULL,
    ADD COLUMN `modelId` VARCHAR(200) NULL;

-- AlterTable
ALTER TABLE `templates` MODIFY `providerKey` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `ai_models` (
    `id` VARCHAR(191) NOT NULL,
    `providerKey` VARCHAR(50) NOT NULL,
    `modelId` VARCHAR(200) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `creditCost` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ai_models_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    INDEX `ai_models_providerKey_idx`(`providerKey`),
    UNIQUE INDEX `ai_models_providerKey_modelId_key`(`providerKey`, `modelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `generations_aiModelId_idx` ON `generations`(`aiModelId`);

-- AddForeignKey
ALTER TABLE `generations` ADD CONSTRAINT `generations_aiModelId_fkey` FOREIGN KEY (`aiModelId`) REFERENCES `ai_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
