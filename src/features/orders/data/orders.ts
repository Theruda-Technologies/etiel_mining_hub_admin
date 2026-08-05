export type OrderStatus = "Processed" | "Pending" | "Failed" | "Processing";

export type OrderItem = {
  id: string;
  name: string;
  description: string;
  sku: string;
  qty: number;
  image: string;
};

export type OrderTimelineEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  active?: boolean;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  buyer: {
    fullName: string;
    company: string;
    email: string;
    phone: string;
    shippingAddress: string[];
  };
  notes: string;
  timeline: OrderTimelineEvent[];
};
