import { getDb } from "@/lib/db";

// Rows are left out of the list: it only needs the summary.
export const listDatasets = (communityId: string) =>
  getDb().dataset.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, period: true, visibility: true, columns: true, createdAt: true },
  });

export const getDataset = (communityId: string, id: string) =>
  getDb().dataset.findFirst({ where: { id, communityId } });
