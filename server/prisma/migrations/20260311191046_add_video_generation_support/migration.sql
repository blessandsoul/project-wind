-- AlterTable
ALTER TABLE `ai_models` ADD COLUMN `type` ENUM('IMAGE', 'VIDEO') NOT NULL DEFAULT 'IMAGE';

-- AlterTable
ALTER TABLE `generations` ADD COLUMN `operationId` VARCHAR(500) NULL,
    ADD COLUMN `outputVideoUrl` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('IMAGE', 'VIDEO') NOT NULL DEFAULT 'IMAGE',
    ADD COLUMN `videoDurationSeconds` INTEGER NULL;

-- AlterTable
ALTER TABLE `templates` ADD COLUMN `type` ENUM('IMAGE', 'VIDEO') NOT NULL DEFAULT 'IMAGE';

-- CreateIndex
CREATE INDEX `ai_models_type_isActive_idx` ON `ai_models`(`type`, `isActive`);

-- CreateIndex
CREATE INDEX `generations_operationId_idx` ON `generations`(`operationId`);

-- CreateIndex
CREATE INDEX `generations_type_userId_idx` ON `generations`(`type`, `userId`);

-- CreateIndex
CREATE INDEX `templates_type_isActive_idx` ON `templates`(`type`, `isActive`);
