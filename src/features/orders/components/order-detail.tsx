"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CartCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  GavelIcon,
  MapPinIcon,
  UserIcon,
} from "@/shared/components/icons";
import { type OrderDetail, type OrderStatus } from "../data/orders";
import { OrderStatusBadge } from "./order-status-badge";

type OrderDetailViewProps = {
  order: OrderDetail;
};

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus(order.status);
    setInternalNotes(order.internalNotes);
  }, [order]);

  const statusOptions = useMemo(() => {
    const options = new Set<OrderStatus>([
      order.status,
      ...order.allowedNextStatuses,
    ]);
    // Keep the currently selected value visible even before refresh
    options.add(status);
    return Array.from(options);
  }, [order.status, order.allowedNextStatuses, status]);

  const isTerminal = order.allowedNextStatuses.length === 0;

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.uuid || order.id,
          status,
          notes: internalNotes,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveMessage(data.error ?? "Save failed.");
      } else {
        setSaveMessage("Changes saved.");
        router.refresh();
      }
    } catch {
      setSaveMessage("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <ChevronRightIcon className="size-3.5" />
            <Link href="/orders" className="hover:text-foreground">
              Orders
            </Link>
            <ChevronRightIcon className="size-3.5" />
            <span className="font-mono text-muted-strong">#{order.id}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              Order #{order.id}
            </h1>
            <OrderStatusBadge status={status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <CartCheckIcon className="size-4 text-accent" />
              <h2 className="text-[15px] font-medium text-foreground">
                Order Items
              </h2>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    {["Item", "SKU", "Qty"].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-8 text-center text-[13px] text-muted"
                      >
                        No line items on this order.
                      </td>
                    </tr>
                  ) : (
                    order.items.map((item) => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="size-12 rounded-md object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div className="flex size-12 items-center justify-center rounded-md bg-background text-[10px] text-muted ring-1 ring-border">
                                —
                              </div>
                            )}
                            <div>
                              <p className="text-[13px] font-semibold text-foreground">
                                {item.name}
                              </p>
                              {item.description ? (
                                <p className="mt-0.5 text-[12px] text-muted">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-[12px] text-muted-strong">
                          {item.sku}
                        </td>
                        <td className="px-5 py-4 text-[13px] text-foreground">
                          {item.qty}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <UserIcon className="size-4 text-accent" />
              <h2 className="text-[15px] font-medium text-foreground">
                Buyer Details
              </h2>
            </header>

            <div className="grid gap-6 p-5 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <h3 className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
                  Contact Information
                </h3>
                <dl className="space-y-3 text-[13px]">
                  <DetailField label="Full Name" value={order.buyer.fullName} />
                  <DetailField label="Company" value={order.buyer.company} />
                  <DetailField
                    label="Email"
                    value={order.buyer.email}
                    accent
                  />
                  <DetailField label="Phone" value={order.buyer.phone} />
                </dl>
              </div>

              <div>
                <h3 className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
                  Shipping Address
                </h3>
                <div className="space-y-1 text-[13px] text-foreground">
                  {order.buyer.shippingAddress.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {order.notes ? (
                  <div className="mt-4">
                    <h3 className="mb-2 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
                      Customer Notes
                    </h3>
                    <p className="text-[13px] text-muted-strong">{order.notes}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-end justify-end">
                <div className="flex size-24 items-center justify-center rounded-md border border-border bg-background">
                  <MapPinIcon className="size-7 text-muted" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <GavelIcon className="size-4 text-accent" />
              <h2 className="text-[15px] font-medium text-foreground">
                Status Management
              </h2>
            </header>

            <div className="flex flex-col gap-4 p-5">
              <label className="flex flex-col gap-2 text-[12px] text-muted">
                Update Status
                <span className="relative">
                  <select
                    value={status}
                    disabled={isTerminal && status === order.status}
                    onChange={(event) =>
                      setStatus(event.target.value as OrderStatus)
                    }
                    className="h-10 w-full appearance-none rounded-md border border-border bg-background px-3 pr-9 text-[13px] text-foreground outline-none focus:border-accent/50 disabled:opacity-60"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                </span>
              </label>
              {isTerminal ? (
                <p className="text-[12px] text-muted">
                  This order is in a final status and cannot be moved further.
                </p>
              ) : (
                <p className="text-[12px] text-muted">
                  Allowed next:{" "}
                  {order.allowedNextStatuses.join(", ") || "none"}
                </p>
              )}

              <label className="flex flex-col gap-2 text-[12px] text-muted">
                Internal Notes
                <textarea
                  value={internalNotes}
                  onChange={(event) => setInternalNotes(event.target.value)}
                  placeholder="Add administrative notes here..."
                  rows={5}
                  className="resize-none rounded-md border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-accent/50"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="mt-1 h-10 w-full rounded-md bg-accent text-[13px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveMessage ? (
                <p
                  className={`text-[12px] ${
                    saveMessage.includes("saved")
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {saveMessage}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
              <ClockIcon className="size-4 text-accent" />
              <h2 className="text-[15px] font-medium text-foreground">
                Timeline
              </h2>
            </header>

            <ol className="space-y-0 p-5">
              {order.timeline.length === 0 ? (
                <li className="text-[13px] text-muted">
                  No timeline events yet.
                </li>
              ) : (
                order.timeline.map((event, index) => {
                  const isLast = index === order.timeline.length - 1;

                  return (
                    <li
                      key={event.id}
                      className="relative flex gap-3 pb-5 last:pb-0"
                    >
                      {!isLast ? (
                        <span className="absolute top-3 left-[7px] h-[calc(100%-4px)] w-px bg-border" />
                      ) : null}
                      <span
                        className={`relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 ${
                          event.active
                            ? "border-accent bg-accent"
                            : "border-muted bg-background"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p
                            className={`text-[13px] font-medium ${
                              event.active ? "text-accent" : "text-foreground"
                            }`}
                          >
                            {event.title}
                          </p>
                          <time className="text-[11px] text-muted">
                            {event.date}
                          </time>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">
                          {event.description}
                        </p>
                      </div>
                    </li>
                  );
                })
              )}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd
        className={`mt-0.5 ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}
