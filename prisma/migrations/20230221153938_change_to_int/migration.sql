-- CreateTable
CREATE TABLE "book" (
    "id" SERIAL NOT NULL,
    "id_subscribe" INTEGER NOT NULL,
    "id_lesson" INTEGER NOT NULL,

    CONSTRAINT "book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "dt_birthday" VARCHAR(100) NOT NULL,
    "passport" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall" (
    "id" SERIAL NOT NULL,
    "capacity" INTEGER NOT NULL,
    "inventory" BOOLEAN,

    CONSTRAINT "hall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" SERIAL NOT NULL,
    "id_hall" INTEGER NOT NULL,
    "id_specialty_of_teacher" INTEGER NOT NULL,
    "dt" TIMESTAMP(6) NOT NULL,
    "cmplx" VARCHAR(100) NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialty_of_teacher" (
    "id" SERIAL NOT NULL,
    "id_tp_lesson" INTEGER NOT NULL,
    "id_teacher" INTEGER NOT NULL,

    CONSTRAINT "specialty_of_teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribe" (
    "id" SERIAL NOT NULL,
    "id_client" INTEGER NOT NULL,
    "dt_begin" DATE,
    "dt_end" DATE,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "subscribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "experience" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "gender" VARCHAR(50) NOT NULL,

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tp_lesson" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "discription" TEXT NOT NULL,

    CONSTRAINT "tp_lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_book__id_lesson" ON "book"("id_lesson");

-- CreateIndex
CREATE INDEX "idx_book__id_subscribe" ON "book"("id_subscribe");

-- CreateIndex
CREATE INDEX "idx_lesson__id_hall" ON "lesson"("id_hall");

-- CreateIndex
CREATE INDEX "idx_lesson__id_specialty_of_teacher" ON "lesson"("id_specialty_of_teacher");

-- CreateIndex
CREATE INDEX "idx_specialty_of_teacher__id_teacher" ON "specialty_of_teacher"("id_teacher");

-- CreateIndex
CREATE INDEX "idx_specialty_of_teacher__id_tp_lesson" ON "specialty_of_teacher"("id_tp_lesson");

-- CreateIndex
CREATE INDEX "idx_subscribe__id_client" ON "subscribe"("id_client");

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "fk_book__id_lesson" FOREIGN KEY ("id_lesson") REFERENCES "lesson"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "fk_book__id_subscribe" FOREIGN KEY ("id_subscribe") REFERENCES "subscribe"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "fk_lesson__id_hall" FOREIGN KEY ("id_hall") REFERENCES "hall"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "fk_lesson__id_specialty_of_teacher" FOREIGN KEY ("id_specialty_of_teacher") REFERENCES "specialty_of_teacher"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "specialty_of_teacher" ADD CONSTRAINT "fk_specialty_of_teacher__id_teacher" FOREIGN KEY ("id_teacher") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "specialty_of_teacher" ADD CONSTRAINT "fk_specialty_of_teacher__id_tp_lesson" FOREIGN KEY ("id_tp_lesson") REFERENCES "tp_lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscribe" ADD CONSTRAINT "fk_subscribe__id_client" FOREIGN KEY ("id_client") REFERENCES "client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
