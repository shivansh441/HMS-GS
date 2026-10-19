-- CreateTable
CREATE TABLE "_PropertyResidents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PropertyResidents_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateIndex
CREATE INDEX "_PropertyResidents_B_index" ON "_PropertyResidents"("B");

-- AddForeignKey
ALTER TABLE "_PropertyResidents" ADD CONSTRAINT "_PropertyResidents_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyResidents" ADD CONSTRAINT "_PropertyResidents_B_fkey" FOREIGN KEY ("B") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
