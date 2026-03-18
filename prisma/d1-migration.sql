-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "category" TEXT,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "buyerCompanyId" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "orderedById" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" DATETIME,
    "notes" TEXT,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "amount" DECIMAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OcrScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "rawText" TEXT,
    "parsedData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documentType" TEXT,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OcrScan_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "lotNumber" TEXT,
    "expiryDate" DATETIME,
    "location" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "reason" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "performedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "issuerCompanyId" TEXT NOT NULL,
    "recipientCompanyId" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL DEFAULT 0.10,
    "taxAmount" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_issuerCompanyId_fkey" FOREIGN KEY ("issuerCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_recipientCompanyId_fkey" FOREIGN KEY ("recipientCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalEntryId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "debitAmount" DECIMAL NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxCategory" TEXT,
    "description" TEXT,
    CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountingExport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exportedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountingExport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNumber" TEXT NOT NULL,
    "originalOrderId" TEXT NOT NULL,
    "buyerCompanyId" TEXT NOT NULL,
    "supplierCompanyId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "reasonDetail" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReturnOrder_originalOrderId_fkey" FOREIGN KEY ("originalOrderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "amount" DECIMAL NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'UNOPENED',
    CONSTRAINT "ReturnOrderItem_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_companyId_lotNumber_key" ON "Inventory"("productId", "companyId", "lotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnOrder_returnNumber_key" ON "ReturnOrder"("returnNumber");

