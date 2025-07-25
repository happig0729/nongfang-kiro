-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CITY_ADMIN', 'DISTRICT_ADMIN', 'TOWN_ADMIN', 'VILLAGE_ADMIN', 'CRAFTSMAN', 'FARMER', 'INSPECTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "HouseType" AS ENUM ('NEW_BUILD', 'RENOVATION', 'EXPANSION', 'REPAIR');

-- CreateEnum
CREATE TYPE "ConstructionStatus" AS ENUM ('PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'MIXED');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "CertificationLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5');

-- CreateEnum
CREATE TYPE "CraftsmanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('CONSTRUCTION_TEAM', 'COOPERATIVE', 'PARTNERSHIP');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('NEW_CONSTRUCTION', 'RENOVATION', 'REPAIR', 'EXPANSION');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('SURVEY', 'DESIGN', 'CONSTRUCTION', 'SUPERVISION', 'BUILDING', 'QUALITY', 'SAFETY', 'PROGRESS');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'COMPLETED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'DURING', 'AFTER', 'INSPECTION', 'PROBLEM');

-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('NEW_BUILD_SATISFACTION', 'RENOVATION_SATISFACTION', 'EXPANSION_SATISFACTION', 'REPAIR_SATISFACTION');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "real_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "role" "UserRole" NOT NULL,
    "region_code" VARCHAR(20) NOT NULL,
    "region_name" VARCHAR(100) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "address" VARCHAR(500) NOT NULL,
    "building_time" DATE,
    "floors" INTEGER,
    "height" DECIMAL(5,2),
    "house_type" "HouseType",
    "construction_status" "ConstructionStatus" NOT NULL DEFAULT 'PLANNED',
    "applicant_id" UUID NOT NULL,
    "region_code" VARCHAR(20) NOT NULL,
    "region_name" VARCHAR(100) NOT NULL,
    "coordinates" TEXT,
    "land_area" DECIMAL(10,2),
    "building_area" DECIMAL(10,2),
    "property_type" "PropertyType",
    "approval_number" VARCHAR(100),
    "completion_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "craftsmen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "id_number" VARCHAR(18) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "specialties" TEXT[],
    "skill_level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "credit_score" INTEGER NOT NULL DEFAULT 100,
    "certification_level" "CertificationLevel",
    "team_id" UUID,
    "region_code" VARCHAR(20) NOT NULL,
    "region_name" VARCHAR(100) NOT NULL,
    "status" "CraftsmanStatus" NOT NULL DEFAULT 'ACTIVE',
    "address" VARCHAR(500),
    "emergency_contact" VARCHAR(100),
    "emergency_phone" VARCHAR(20),
    "join_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "craftsmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "team_type" "TeamType" NOT NULL,
    "leader_id" UUID,
    "region_code" VARCHAR(20) NOT NULL,
    "region_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "craftsman_id" UUID NOT NULL,
    "training_type" VARCHAR(100) NOT NULL,
    "training_content" TEXT NOT NULL,
    "duration_hours" INTEGER NOT NULL,
    "training_date" DATE NOT NULL,
    "completion_status" "CompletionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "certificate_url" VARCHAR(500),
    "instructor" VARCHAR(100) NOT NULL,
    "training_location" VARCHAR(200),
    "score" INTEGER,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "craftsman_id" UUID NOT NULL,
    "evaluation_type" VARCHAR(50) NOT NULL,
    "points_change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "evaluator_id" UUID NOT NULL,
    "evaluation_date" DATE NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "house_id" UUID NOT NULL,
    "craftsman_id" UUID NOT NULL,
    "project_name" VARCHAR(200) NOT NULL,
    "project_type" "ProjectType" NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "estimated_cost" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "project_status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT,
    "contract_number" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construction_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "house_id" UUID NOT NULL,
    "inspector_id" UUID NOT NULL,
    "inspection_type" "InspectionType" NOT NULL,
    "inspection_date" DATE NOT NULL,
    "result" "InspectionResult" NOT NULL,
    "score" INTEGER,
    "issues" TEXT,
    "suggestions" TEXT,
    "photos" TEXT[],
    "follow_up_date" DATE,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "house_id" UUID NOT NULL,
    "photo_url" VARCHAR(500) NOT NULL,
    "photo_type" "PhotoType" NOT NULL,
    "description" VARCHAR(200),
    "taken_at" TIMESTAMP(3) NOT NULL,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satisfaction_surveys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "house_id" UUID NOT NULL,
    "survey_type" "SurveyType" NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "quality_score" INTEGER,
    "service_score" INTEGER,
    "time_score" INTEGER,
    "feedback" TEXT,
    "respondent" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "survey_date" DATE NOT NULL,
    "status" "SurveyStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satisfaction_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_region_code_idx" ON "users"("region_code");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "houses_region_code_idx" ON "houses"("region_code");

-- CreateIndex
CREATE INDEX "houses_construction_status_idx" ON "houses"("construction_status");

-- CreateIndex
CREATE INDEX "houses_house_type_idx" ON "houses"("house_type");

-- CreateIndex
CREATE UNIQUE INDEX "craftsmen_id_number_key" ON "craftsmen"("id_number");

-- CreateIndex
CREATE INDEX "craftsmen_region_code_idx" ON "craftsmen"("region_code");

-- CreateIndex
CREATE INDEX "craftsmen_skill_level_idx" ON "craftsmen"("skill_level");

-- CreateIndex
CREATE INDEX "craftsmen_credit_score_idx" ON "craftsmen"("credit_score");

-- CreateIndex
CREATE INDEX "craftsmen_status_idx" ON "craftsmen"("status");

-- CreateIndex
CREATE INDEX "teams_region_code_idx" ON "teams"("region_code");

-- CreateIndex
CREATE INDEX "teams_team_type_idx" ON "teams"("team_type");

-- CreateIndex
CREATE INDEX "training_records_craftsman_id_idx" ON "training_records"("craftsman_id");

-- CreateIndex
CREATE INDEX "training_records_training_date_idx" ON "training_records"("training_date");

-- CreateIndex
CREATE INDEX "training_records_completion_status_idx" ON "training_records"("completion_status");

-- CreateIndex
CREATE INDEX "credit_evaluations_craftsman_id_idx" ON "credit_evaluations"("craftsman_id");

-- CreateIndex
CREATE INDEX "credit_evaluations_evaluation_date_idx" ON "credit_evaluations"("evaluation_date");

-- CreateIndex
CREATE INDEX "credit_evaluations_evaluation_type_idx" ON "credit_evaluations"("evaluation_type");

-- CreateIndex
CREATE INDEX "construction_projects_house_id_idx" ON "construction_projects"("house_id");

-- CreateIndex
CREATE INDEX "construction_projects_craftsman_id_idx" ON "construction_projects"("craftsman_id");

-- CreateIndex
CREATE INDEX "construction_projects_project_status_idx" ON "construction_projects"("project_status");

-- CreateIndex
CREATE INDEX "inspections_house_id_idx" ON "inspections"("house_id");

-- CreateIndex
CREATE INDEX "inspections_inspection_date_idx" ON "inspections"("inspection_date");

-- CreateIndex
CREATE INDEX "inspections_inspection_type_idx" ON "inspections"("inspection_type");

-- CreateIndex
CREATE INDEX "house_photos_house_id_idx" ON "house_photos"("house_id");

-- CreateIndex
CREATE INDEX "house_photos_photo_type_idx" ON "house_photos"("photo_type");

-- CreateIndex
CREATE INDEX "satisfaction_surveys_survey_date_idx" ON "satisfaction_surveys"("survey_date");

-- CreateIndex
CREATE INDEX "satisfaction_surveys_survey_type_idx" ON "satisfaction_surveys"("survey_type");

-- CreateIndex
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "system_logs_action_idx" ON "system_logs"("action");

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "craftsmen" ADD CONSTRAINT "craftsmen_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_craftsman_id_fkey" FOREIGN KEY ("craftsman_id") REFERENCES "craftsmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_evaluations" ADD CONSTRAINT "credit_evaluations_craftsman_id_fkey" FOREIGN KEY ("craftsman_id") REFERENCES "craftsmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_evaluations" ADD CONSTRAINT "credit_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_projects" ADD CONSTRAINT "construction_projects_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_projects" ADD CONSTRAINT "construction_projects_craftsman_id_fkey" FOREIGN KEY ("craftsman_id") REFERENCES "craftsmen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_photos" ADD CONSTRAINT "house_photos_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE ON UPDATE CASCADE;