-- CreateTable
CREATE TABLE "sessao" (
    "id" SERIAL NOT NULL,
    "sessionID" TEXT NOT NULL,
    "creds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessao_id_key" ON "sessao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "sessao_sessionID_key" ON "sessao"("sessionID");
