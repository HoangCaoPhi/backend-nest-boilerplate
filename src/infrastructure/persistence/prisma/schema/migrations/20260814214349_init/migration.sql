-- CreateTable
CREATE TABLE "outbox_messages" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "processedOn" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "outbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "processedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processed_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL,
    "todoListId" TEXT NOT NULL,

    CONSTRAINT "todo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_lists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "colourCode" TEXT NOT NULL,

    CONSTRAINT "todo_lists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_messages_processedOn_occurredOn_idx" ON "outbox_messages"("processedOn", "occurredOn");

-- AddForeignKey
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_todoListId_fkey" FOREIGN KEY ("todoListId") REFERENCES "todo_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
