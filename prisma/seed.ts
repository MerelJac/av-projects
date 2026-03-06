import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
// import { seedProgramExercises } from "./seed/exercises";
// import { seedProgramEccentric } from "./seed/program-eccentric-upper-lower";

// RUN: npx prisma db seed
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Optional: seed users (uncomment when needed)

  const passwordHash = await bcrypt.hash("Testingtest", 10);

  const admin = await prisma.user.upsert({
    where: { email: "merelbjacobs@gmail.com" },
    update: {},
    create: {
      email: "merelbjacobs@gmail.com",
      password: passwordHash,
      role: "TEAM",
    },
  });

  console.log("✅ Seeding users");

  //  console.log("✅ Seeded program exercises");

  //  await seedProgramEccentric();

  /*
  CUSTOMERS
  */

  const nike = await prisma.customer.create({
    data: {
      name: "Nike HQ",
      email: "procurement@nike.com",
      phone: "503-555-1111",
      billingTerm: "NET30",
    },
  });

  const intel = await prisma.customer.create({
    data: {
      name: "Intel Corporation",
      email: "purchasing@intel.com",
      phone: "503-555-2222",
      billingTerm: "PROGRESS",
    },
  });

  /*
  ITEMS
  */
const switchItem = await prisma.item.upsert({
  where: { itemNumber: "CISCO-SW-9200" },
  update: {},
  create: {
    itemNumber: "CISCO-SW-9200",
    manufacturer: "Cisco",
    cost: 2200,
    price: 4200,
    lastSoldPrice: 4000,
    approved: true,
    category: "Networking",
    type: "HARDWARE",
  },
});

const rackItem = await prisma.item.upsert({
  where: { itemNumber: "RACK-42U" },
  update: {},
  create: {
    itemNumber: "RACK-42U",
    manufacturer: "Middle Atlantic",
    cost: 900,
    price: 1800,
    lastSoldPrice: 1700,
    approved: true,
    category: "Infrastructure",
    type: "HARDWARE",
  },
});

const laborItem = await prisma.item.upsert({
  where: { itemNumber: "LABOR-INSTALL" },
  update: {},
  create: {
    itemNumber: "LABOR-INSTALL",
    manufacturer: "Internal",
    cost: 60,
    price: 150,
    approved: true,
    category: "Services",
    type: "SERVICE",
  },
});

  /*
  CUSTOMER SPECIFIC PRICING
  */

  await prisma.customerItemPrice.create({
    data: {
      customerId: nike.id,
      itemId: switchItem.id,
      price: 3950,
    },
  });

  /*
  PROJECT
  */

  const project = await prisma.project.create({
    data: {
      name: "Nike HQ Conference Room AV",
      customerId: nike.id,
      billingTerms: "PROGRESS",
      totalBudget: 25000,
    },
  });

  /*
  QUOTE
  */

  const quote = await prisma.quote.create({
    data: {
      customerId: nike.id,
      status: "DRAFT",
      projectId: project.id,
    },
  });

  /*
  PROJECT MILESTONES
  */

  await prisma.projectMilestone.createMany({
    data: [
      {
        projectId: project.id,
        name: "Equipment Ordered",
      },
      {
        projectId: project.id,
        name: "Installation",
      },
      {
        projectId: project.id,
        name: "System Commissioning",
      },
    ],
  });

  /*
  QUOTE BUNDLES
  */

  const hardwareBundle = await prisma.quoteBundle.create({
    data: {
      quoteId: quote.id,
      name: "Hardware Package",
    },
  });

  const servicesBundle = await prisma.quoteBundle.create({
    data: {
      quoteId: quote.id,
      name: "Professional Services",
    },
  });

  /*
  QUOTE LINES
  */

  await prisma.quoteLine.createMany({
    data: [
      {
        quoteId: quote.id,
        bundleId: hardwareBundle.id,
        itemId: switchItem.id,
        description: "Cisco Catalyst Switch",
        quantity: 2,
        price: 3950,
        cost: 2200,
      },
      {
        quoteId: quote.id,
        bundleId: hardwareBundle.id,
        itemId: rackItem.id,
        description: "42U Equipment Rack",
        quantity: 1,
        price: 1700,
        cost: 900,
      },
      {
        quoteId: quote.id,
        bundleId: servicesBundle.id,
        itemId: laborItem.id,
        description: "Installation Labor",
        quantity: 30,
        price: 150,
        cost: 60,
      },
    ],
  });

  /*

  INVOICE
  */

  await prisma.invoice.create({
    data: {
      projectId: project.id,
      amount: 12000,
      status: "SENT",
    },
  });

  /*
  SHIPMENT
  */

  await prisma.shipment.create({
    data: {
      projectId: project.id,
      itemId: switchItem.id,
      quantity: 2,
      carrier: "UPS",
      tracking: "1Z999AA10123456784",
      shippedBy: "Ashley",
    },
  });

  /*
  PURCHASE ORDER
  */

  const po = await prisma.purchaseOrder.create({
    data: {
      vendor: "Cisco Distributor",
      projectId: project.id,
      status: "SENT",
    },
  });

  await prisma.purchaseOrderLine.create({
    data: {
      poId: po.id,
      itemId: switchItem.id,
      quantity: 2,
      cost: 2200,
    },
  });

  /*
  TIME ENTRY
  */

  await prisma.timeEntry.create({
    data: {
      projectId: project.id,
      userId: admin.id,
      hours: 6,
      notes: "Initial rack installation",
    },
  });

  /*
  SUBSCRIPTION
  */

  await prisma.subscription.create({
    data: {
      itemId: switchItem.id,
      customerId: nike.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      notes: "Support contract",
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
