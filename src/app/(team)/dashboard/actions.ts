import { prisma } from "@/lib/prisma";

const now = new Date();
const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0, 0, 0, 0);

export async function getDashboardData() {
  const [
    activeProjects,
    openSalesOrders,
    invoices30d,
    overdueInvoices,
    activeSubscriptions,
    upcomingMilestones,
    overdueMilestones,
    recentTimeEntries,
    projectHours,
    openPOs,
    acceptedQuotes30d,
  ] = await Promise.all([
    // Active projects (no closed status, just all projects for now)
    prisma.project.findMany({
      include: {
        customer: { select: { name: true } },
        milestones: true,
        invoices: true,
        timeEntries: { select: { hours: true } },
        salesOrders: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Open sales orders
    prisma.salesOrder.findMany({
      where: { status: "OPEN" },
      include: {
        customer: { select: { name: true } },
        project: { select: { name: true } },
        lines: { select: { price: true, quantity: true, cost: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Invoices last 30 days
    prisma.invoice.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: { project: { include: { customer: { select: { name: true } } } } },
    }),

    // Overdue invoices (SENT but not paid, issued > 30 days ago)
    prisma.invoice.findMany({
      where: {
        status: "SENT",
        issuedAt: { lte: thirtyDaysAgo },
      },
      include: { project: { include: { customer: { select: { name: true } } } } },
      orderBy: { issuedAt: "asc" },
    }),

    // Active subscriptions
    prisma.subscription.count({
      where: { status: "ACTIVE" },
    }),

    // Upcoming milestones (next 30 days, not completed)
    prisma.projectMilestone.findMany({
      where: {
        completed: false,
        dueDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      },
      include: { project: { include: { customer: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),

    // Overdue milestones
    prisma.projectMilestone.findMany({
      where: {
        completed: false,
        dueDate: { lt: now },
      },
      include: { project: { include: { customer: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),

    // Time entries this week
    prisma.timeEntry.findMany({
      where: { date: { gte: startOfWeek } },
      include: {
        user: { include: { profile: true } },
        project: { select: { name: true } },
        scope: { select: { name: true, estimatedHours: true } },
      },
      orderBy: { date: "desc" },
    }),

    // Hours per project (all time entries, grouped)
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
        customer: { select: { name: true } },
        scopes: { select: { estimatedHours: true, name: true } },
        timeEntries: { select: { hours: true, date: true } },
        totalBudget: true,
        invoiced: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Open POs
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["DRAFT", "SENT", "PARTIALLY_RECEIVED"] } },
      include: {
        project: { select: { name: true } },
        lines: { select: { quantity: true, receivedQuantity: true, cost: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Accepted quotes last 30 days (for margin calc)
    prisma.quote.findMany({
      where: {
        status: "ACCEPTED",
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        lines: { select: { price: true, cost: true, quantity: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);

  // --- Derived calculations ---

  // Revenue (paid invoices last 30d)
  const revenue30d = invoices30d
    .filter(i => i.status === "PAID")
    .reduce((s, i) => s + i.amount, 0);

  // Invoiced but unpaid last 30d
  const invoiced30d = invoices30d
    .filter(i => i.status === "SENT")
    .reduce((s, i) => s + i.amount, 0);

  // Overdue total
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0);

  // Hours this week
  const hoursThisWeek = recentTimeEntries.reduce((s, e) => s + e.hours, 0);

  // Margin from accepted quotes
  const quotesWithMargin = acceptedQuotes30d.map(q => {
    const revenue = q.lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const cost = q.lines.reduce((s, l) => s + (l.cost ?? 0) * l.quantity, 0);
    return { customer: q.customer.name, revenue, cost, margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0 };
  });

  const avgMargin = quotesWithMargin.length
    ? quotesWithMargin.reduce((s, q) => s + q.margin, 0) / quotesWithMargin.length
    : null;

  // Project hour burn
  const projectBurn = projectHours.map(p => {
    const estimated = p.scopes.reduce((s, sc) => s + sc.estimatedHours, 0);
    const logged = p.timeEntries.reduce((s, e) => s + e.hours, 0);
    const burn = estimated > 0 ? (logged / estimated) * 100 : null;
    return {
      id: p.id,
      name: p.name,
      customer: p.customer.name,
      estimated,
      logged,
      burn,
      totalBudget: p.totalBudget,
      invoiced: p.invoiced,
    };
  });

  // SO value
  const openSOValue = openSalesOrders.reduce((s, so) => {
    return s + so.lines.reduce((ls, l) => ls + Number(l.price) * l.quantity, 0);
  }, 0);

  // Serialize SalesOrder lines (Decimal → number) so they pass the server→client boundary
  const serializedSalesOrders = openSalesOrders.map(so => ({
    ...so,
    lines: so.lines.map(l => ({
      ...l,
      price: Number(l.price),
      cost: l.cost != null ? Number(l.cost) : null,
    })),
  }));

  return {
    kpis: {
      activeProjects: activeProjects.length,
      openSalesOrders: openSalesOrders.length,
      openSOValue,
      revenue30d,
      invoiced30d,
      overdueTotal,
      overdueCount: overdueInvoices.length,
      activeSubscriptions,
      hoursThisWeek,
      avgMargin,
    },
    milestones: { upcoming: upcomingMilestones, overdue: overdueMilestones },
    recentTimeEntries: recentTimeEntries.slice(0, 10),
    projectBurn,
    openSalesOrders: serializedSalesOrders,
    openPOs,
    overdueInvoices,
    quotesWithMargin,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;