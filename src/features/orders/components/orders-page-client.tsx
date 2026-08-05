"use client";

import { useTranslation } from "react-i18next";
import { OrdersTable } from "@/features/orders/components/orders-table";
import type { OrderStatus } from "@/features/orders/data/orders";

type OrderRow = {
  id: string;
  status: OrderStatus;
  buyer: { fullName: string; company: string };
};

export function OrdersPageClient({ orders }: { orders: OrderRow[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[28px] font-bold tracking-tight">
          {t("orders.title")}
        </h2>
        <p className="mt-1 text-[14px] text-muted">{t("orders.subtitle")}</p>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
