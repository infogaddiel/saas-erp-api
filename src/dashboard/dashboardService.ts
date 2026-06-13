import { col, fn, Op, WhereOptions } from 'sequelize';
import { Customer, CustomerType, Lead, LeadStatus, Project, Ticket, TicketStatus, User } from '../models';

const PROJECT_STATUS_ORDER = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as const;
const ACTIVE_PROJECT_STATUSES = ['Planning', 'In Progress', 'On Hold'] as const;

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const startOfMonth = (date: Date) => {
  const value = new Date(date.getFullYear(), date.getMonth(), 1);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getPercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const createdByCompanyInclude = (companyId: number) => ({
  model: User,
  as: 'createdBy',
  attributes: [],
  required: true,
  where: { company_id: companyId },
});

const normalizeProjectStatusLabel = (status: string) => {
  if (status === 'In Progress') return 'Active';
  return status;
};

export const getGeneralOverviewDashboard = async (companyId: number) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const next30DaysEnd = endOfDay(addDays(now, 30));
    const last30DaysStart = startOfDay(addDays(now, -29));
    const currentWeekStart = startOfDay(addDays(now, -6));
    const previousWeekStart = startOfDay(addDays(now, -13));
    const previousWeekEnd = endOfDay(addDays(now, -7));
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const previousMonthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));

    const projectStatusWhere: WhereOptions = {
      status: {
        [Op.in]: [...PROJECT_STATUS_ORDER],
      },
    };

    const activeProjectWhere: WhereOptions = {
      status: {
        [Op.in]: [...ACTIVE_PROJECT_STATUSES],
      },
    };

    const nearCompletionWhere: WhereOptions = {
      status: {
        [Op.in]: [...ACTIVE_PROJECT_STATUSES],
      },
      end_date: {
        [Op.gte]: todayStart,
        [Op.lte]: next30DaysEnd,
      },
    };

    const [
      totalTickets,
      ticketsLast30Days,
      activeCustomers,
      customersThisMonth,
      customersPreviousMonth,
      activeProjects,
      projectsNearCompletion,
      totalLeads,
      leadsThisWeek,
      leadsPreviousWeek,
      projectStatusCountsRaw,
      leadStatuses,
      leadStatusCountsRaw,
      ticketStatuses,
      ticketStatusCountsRaw,
      customerTypes,
      customerTypeCountsRaw,
    ] = await Promise.all([
      Ticket.count({ include: [createdByCompanyInclude(companyId)] as any }),
      Ticket.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: {
          created_at: {
            [Op.gte]: last30DaysStart,
            [Op.lte]: endOfDay(now),
          },
        },
      }),
      Customer.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: { status: true },
      }),
      Customer.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: {
          created_at: {
            [Op.gte]: currentMonthStart,
            [Op.lte]: endOfDay(now),
          },
        },
      }),
      Customer.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: {
          created_at: {
            [Op.gte]: previousMonthStart,
            [Op.lte]: previousMonthEnd,
          },
        },
      }),
      Project.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: activeProjectWhere,
      }),
      Project.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: nearCompletionWhere,
      }),
      Lead.count({ include: [createdByCompanyInclude(companyId)] as any }),
      Lead.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: {
          created_at: {
            [Op.gte]: currentWeekStart,
            [Op.lte]: endOfDay(now),
          },
        },
      }),
      Lead.count({
        include: [createdByCompanyInclude(companyId)] as any,
        where: {
          created_at: {
            [Op.gte]: previousWeekStart,
            [Op.lte]: previousWeekEnd,
          },
        },
      }),
      Project.findAll({
        attributes: ['status', [fn('COUNT', col('Project.id')), 'count']],
        include: [createdByCompanyInclude(companyId)] as any,
        where: projectStatusWhere,
        group: ['Project.status'],
        raw: true,
      }),
      LeadStatus.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']],
      }),
      Lead.findAll({
        attributes: ['lead_status_id', [fn('COUNT', col('Lead.id')), 'count']],
        include: [createdByCompanyInclude(companyId)] as any,
        group: ['Lead.lead_status_id'],
        raw: true,
      }),
      TicketStatus.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']],
      }),
      Ticket.findAll({
        attributes: ['status_id', [fn('COUNT', col('Ticket.id')), 'count']],
        include: [createdByCompanyInclude(companyId)] as any,
        group: ['Ticket.status_id'],
        raw: true,
      }),
      CustomerType.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']],
      }),
      Customer.findAll({
        attributes: ['customer_type_id', [fn('COUNT', col('Customer.id')), 'count']],
        include: [createdByCompanyInclude(companyId)] as any,
        group: ['Customer.customer_type_id'],
        raw: true,
      }),
    ]);

    const projectCountsMap = new Map<string, number>();
    for (const row of projectStatusCountsRaw as unknown as Array<{ status: string; count: number | string }>) {
      projectCountsMap.set(row.status, Number(row.count ?? 0));
    }

    const leadCountsMap = new Map<number, number>();
    for (const row of leadStatusCountsRaw as unknown as Array<{ lead_status_id: number | string; count: number | string }>) {
      leadCountsMap.set(Number(row.lead_status_id), Number(row.count ?? 0));
    }

    const ticketCountsMap = new Map<number, number>();
    for (const row of ticketStatusCountsRaw as unknown as Array<{ status_id: number | string; count: number | string }>) {
      ticketCountsMap.set(Number(row.status_id), Number(row.count ?? 0));
    }

    const customerTypeCountsMap = new Map<number, number>();
    for (const row of customerTypeCountsRaw as unknown as Array<{ customer_type_id: number | string | null; count: number | string }>) {
      const typeId = Number(row.customer_type_id);
      if (!Number.isNaN(typeId)) {
        customerTypeCountsMap.set(typeId, Number(row.count ?? 0));
      }
    }

    return {
      success: true,
      data: {
        summary: {
          total_tickets: {
            count: totalTickets,
            last_30_days_count: ticketsLast30Days,
          },
          active_customers: {
            count: activeCustomers,
            growth_percentage_from_last_month: getPercentageChange(customersThisMonth, customersPreviousMonth),
            current_month_count: customersThisMonth,
            previous_month_count: customersPreviousMonth,
          },
          active_projects: {
            count: activeProjects,
            near_completion_count: projectsNearCompletion,
          },
          new_leads: {
            count: totalLeads,
            growth_percentage_this_week: getPercentageChange(leadsThisWeek, leadsPreviousWeek),
            current_week_count: leadsThisWeek,
            previous_week_count: leadsPreviousWeek,
          },
        },
        charts: {
          project_portfolio_status: PROJECT_STATUS_ORDER.map((status) => ({
            status,
            label: normalizeProjectStatusLabel(status),
            count: projectCountsMap.get(status) ?? 0,
          })),
          leads_sales_pipeline: leadStatuses.map((status: any) => ({
            lead_status_id: status.id,
            status_name: status.name,
            count: leadCountsMap.get(status.id) ?? 0,
          })),
          ticket_status_distribution: ticketStatuses.map((status: any) => ({
            ticket_status_id: status.id,
            status_name: status.name,
            count: ticketCountsMap.get(status.id) ?? 0,
          })),
          customer_growth_by_type: customerTypes.map((type: any) => ({
            customer_type_id: type.id,
            customer_type_name: type.name,
            count: customerTypeCountsMap.get(type.id) ?? 0,
          })),
        },
      },
    };
  } catch (error) {
    console.error('getGeneralOverviewDashboard error:', error);
    return { success: false, message: 'Error fetching dashboard data' };
  }
};
