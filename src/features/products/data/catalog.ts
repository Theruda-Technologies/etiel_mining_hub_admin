export type CatalogStatus = "Active" | "Draft" | "Archived";

export type SpecRow = {
  id: string;
  key: string;
  value: string;
};

export type CatalogProduct = {
  id: string;
  title: string;
  sku: string;
  status: CatalogStatus;
  image?: string;
  description: string;
  specs: SpecRow[];
};

export type CatalogService = {
  id: string;
  title: string;
  status: CatalogStatus;
  icon: "headset" | "gradcap";
};

export const sampleProducts: CatalogProduct[] = [
  {
    id: "magnetar-drill-x",
    title: "MAGNETAR Drill X",
    sku: "DRL-X9-882",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=240&h=240&fit=crop",
    description:
      "Heavy-duty rotary drill platform for deep-core mineral sampling in remote extraction sites.",
    specs: [
      { id: "1", key: "Power Output", value: "450 kW" },
      { id: "2", key: "Depth Rating", value: "1,200m" },
    ],
  },
  {
    id: "titan-conveyor-c",
    title: "Titan Conveyor C",
    sku: "CNV-T400-E",
    status: "Draft",
    description:
      "Modular overland conveyor section for high-volume ore transfer between crushers and stockpiles.",
    specs: [
      { id: "1", key: "Belt Width", value: "1,200 mm" },
      { id: "2", key: "Capacity", value: "2,400 t/h" },
    ],
  },
];

export const sampleServices: CatalogService[] = [
  {
    id: "field-support",
    title: "24/7 Field Support",
    status: "Active",
    icon: "headset",
  },
  {
    id: "operator-cert",
    title: "Operator Certification",
    status: "Active",
    icon: "gradcap",
  },
];
