import { notFound } from "next/navigation";
import { getOrderById, OrderDetailView } from "@/features/orders";

export default async function OrderDetailPage(
  props: PageProps<"/orders/[id]">,
) {
  const { id } = await props.params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}
