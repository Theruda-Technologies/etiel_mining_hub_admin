import Link from "next/link";
import { listOrders } from "@/features/orders";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";

export default async function OrdersPage() {
  const list = await listOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[28px] font-semibold tracking-tight">Orders</h2>
        <p className="mt-1 text-[14px] text-muted">
          Manage mining equipment and logistics orders.
        </p>
      </div>

      <section className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {["Order ID", "Buyer", "Company", "Status"].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[13px] text-muted"
                  >
                    No orders yet. Run `npm run seed` to load demo data.
                  </td>
                </tr>
              ) : (
                list.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono text-[13px] font-semibold text-accent hover:underline"
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {order.buyer.fullName}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {order.buyer.company}
                    </td>
                    <td className="px-4 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
