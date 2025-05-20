-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Salary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "payable" INTEGER NOT NULL,
    "changes" JSONB NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Salary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Salary" ("baseSalary", "changes", "createdAt", "employeeId", "id", "month", "payable") SELECT "baseSalary", "changes", "createdAt", "employeeId", "id", "month", "payable" FROM "Salary";
DROP TABLE "Salary";
ALTER TABLE "new_Salary" RENAME TO "Salary";
CREATE INDEX "Salary_employeeId_idx" ON "Salary"("employeeId");
CREATE INDEX "Salary_month_idx" ON "Salary"("month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
