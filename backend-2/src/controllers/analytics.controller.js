import { prisma } from '../utils/prisma.js';
// ============================================================================
// 10.1: THE GOD-LEVEL DASHBOARD (High-Level Pulse)
// ============================================================================
export const getGodLevelDashboard = async (req, res) => {
    try {
        const userRole = req.user.role;
        const propertyId = parseInt(req.params.propertyId, 10);
        // Time Boundaries
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // ==========================================
        // 1. MANAGER VIEW (Specific Property Pulse)
        // ==========================================
        if (userRole === 'MANAGER') {
            // 1. Available Rooms
            const availableRooms = await prisma.unit.count({
                where: { propertyId, status: 'AVAILABLE' }
            });
            // 2. Revenue Generated (This Month - Money in the bank only)
            const revenueData = await prisma.financialLedger.aggregate({
                where: { propertyId, status: 'PAID', transactionType: 'INCOME', createdAt: { gte: startOfMonth } },
                _sum: { totalAmount: true }
            });
            // 3. Staff Present
            const staffPresent = await prisma.account.count({
                where: { propertyId, role: 'STAFF', isActive: true, isDeleted: false }
            });
            // 4. Today's Front Desk Traffic
            const checkInsToday = await prisma.unitAssignment.count({
                where: { propertyId, expectedCheckIn: { gte: todayStart, lte: todayEnd }, isActive: true }
            });
            const checkOutsToday = await prisma.unitAssignment.count({
                where: { propertyId, expectedCheckOut: { gte: todayStart, lte: todayEnd }, isActive: true }
            });
            // 5. Notifications Feed (Recent Audit Logs for this property)
            const recentNotifications = await prisma.auditLog.findMany({
                where: { propertyId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { action: true, details: true, createdAt: true }
            });
            // 6. Graph Data: 7-Day Revenue Trend (Safe Node.js grouping)
            const sevenDaysAgo = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));
            const recentLedgers = await prisma.financialLedger.findMany({
                where: { propertyId, status: 'PAID', transactionType: 'INCOME', createdAt: { gte: sevenDaysAgo } },
                select: { totalAmount: true, createdAt: true }
            });
            const revenueTrend = recentLedgers.reduce((acc, ledger) => {
                // FIX: Use substring(0,10) instead of split('T')[0] to avoid TypeScript undefined errors
                const dateString = ledger.createdAt.toISOString().substring(0, 10);
                acc[dateString] = (acc[dateString] || 0) + Number(ledger.totalAmount);
                return acc;
            }, {});
            // Format for frontend charting libraries (e.g., Recharts or Chart.js)
            const formattedRevenueTrend = Object.keys(revenueTrend).map(date => ({
                date,
                revenue: revenueTrend[date]
            }));
            return res.status(200).json({
                role: 'MANAGER',
                data: {
                    metrics: {
                        availableRooms,
                        revenueGenerated: Number(revenueData._sum.totalAmount || 0),
                        staffPresent,
                        checkInsToday,
                        checkOutsToday
                    },
                    notifications: recentNotifications,
                    graphs: {
                        revenueTrend: formattedRevenueTrend
                    }
                }
            });
        }
        // ==========================================
        // 2. SUPER ADMIN VIEW (God Level Portfolio)
        // ==========================================
        if (userRole === 'SUPER_ADMIN') {
            // 1. Global Revenue (All Properties combined)
            const globalRevenue = await prisma.financialLedger.aggregate({
                where: { status: 'PAID', transactionType: 'INCOME', createdAt: { gte: startOfMonth } },
                _sum: { totalAmount: true }
            });
            // 2. Property vs Property Comparison Array
            const properties = await prisma.property.findMany({
                where: { isDeleted: false },
                select: { id: true, name: true }
            });
            const propertyComparison = await Promise.all(properties.map(async (prop) => {
                const propRev = await prisma.financialLedger.aggregate({
                    where: { propertyId: prop.id, status: 'PAID', transactionType: 'INCOME', createdAt: { gte: startOfMonth } },
                    _sum: { totalAmount: true }
                });
                const occupiedUnits = await prisma.unit.count({ where: { propertyId: prop.id, status: 'OCCUPIED' } });
                const totalUnits = await prisma.unit.count({ where: { propertyId: prop.id, status: { not: 'MAINTENANCE' } } });
                return {
                    propertyId: prop.id,
                    propertyName: prop.name,
                    revenue: Number(propRev._sum.totalAmount || 0),
                    occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
                };
            }));
            // 3. Global System Alerts (Failures across all properties)
            const globalAlerts = await prisma.systemStatusLog.findMany({
                where: { action: { in: ['EMAIL_SENT_FAILED', 'PAYMENT_FAILED', 'REFUND_ISSUED'] } },
                orderBy: { createdAt: 'desc' },
                take: 8
            });
            return res.status(200).json({
                role: 'SUPER_ADMIN',
                data: {
                    globalMetrics: {
                        totalRevenue: Number(globalRevenue._sum.totalAmount || 0),
                        totalProperties: properties.length
                    },
                    propertyComparison,
                    globalAlerts
                }
            });
        }
        return res.status(403).json({ error: 'Role not recognized for analytics dashboard.' });
    }
    catch (error) {
        console.error('[AnalyticsController: getGodLevelDashboard]', error);
        return res.status(500).json({ error: 'Failed to load dashboard.' });
    }
};
// ============================================================================
// 10.2: OCCUPANCY & INVENTORY ENGINE (Deep Dive)
// ============================================================================
export const getOccupancyStats = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 1. Get Unit Distribution by Status
        const units = await prisma.unit.groupBy({
            by: ['status'],
            where: { propertyId, isDeleted: false },
            _count: { _all: true }
        });
        let totalUnits = 0;
        let occupiedUnits = 0;
        let availableUnits = 0;
        let maintenanceUnits = 0;
        units.forEach(group => {
            totalUnits += group._count._all;
            if (group.status === 'OCCUPIED')
                occupiedUnits += group._count._all;
            if (group.status === 'AVAILABLE')
                availableUnits += group._count._all;
            if (group.status === 'MAINTENANCE')
                maintenanceUnits += group._count._all;
        });
        const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(2) : 0;
        // 2. Today's Front Desk Activity (Arrivals & Departures)
        const arrivalsToday = await prisma.unitAssignment.count({
            where: {
                unit: { propertyId },
                expectedCheckIn: { gte: today, lt: tomorrow },
                actualCheckIn: null // Not checked in yet
            }
        });
        const departuresToday = await prisma.unitAssignment.count({
            where: {
                unit: { propertyId },
                expectedCheckOut: { gte: today, lt: tomorrow },
                actualCheckOut: null // Not checked out yet
            }
        });
        return res.status(200).json({
            data: {
                occupancyRate: `${occupancyRate}%`,
                inventory: { total: totalUnits, occupied: occupiedUnits, available: availableUnits, maintenance: maintenanceUnits },
                frontDesk: { arrivalsToday, departuresToday }
            }
        });
    }
    catch (error) {
        console.error('[Analytics: Occupancy]', error);
        return res.status(500).json({ error: 'Failed to generate occupancy stats.' });
    }
};
// ============================================================================
// 10.3: FINANCIAL COMMAND CENTER (P&L, RevPAR)
// ============================================================================
export const getFinancialStats = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        const month = req.query.month ? parseInt(req.query.month, 10) : new Date().getMonth();
        const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);
        const daysInMonth = endDate.getDate();
        // 1. Revenue (Collected Income)
        const incomeAgg = await prisma.financialLedger.aggregate({
            where: {
                propertyId,
                transactionType: 'INCOME',
                status: 'PAID',
                createdAt: { gte: startDate, lte: endDate },
                isDeleted: false
            },
            _sum: { totalAmount: true }
        });
        const totalRevenue = Number(incomeAgg._sum.totalAmount || 0);
        // 2. Pending Dues (Money stuck on the street)
        const pendingAgg = await prisma.financialLedger.aggregate({
            where: {
                propertyId,
                transactionType: 'INCOME',
                status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
                createdAt: { gte: startDate, lte: endDate },
                isDeleted: false
            },
            _sum: { totalAmount: true, paidAmount: true }
        });
        const totalPending = Number(pendingAgg._sum.totalAmount || 0) - Number(pendingAgg._sum.paidAmount || 0);
        // 3. Expenses (Payroll, Maintenance, etc.)
        const expenseAgg = await prisma.financialLedger.aggregate({
            where: {
                propertyId,
                transactionType: 'EXPENSE',
                createdAt: { gte: startDate, lte: endDate },
                isDeleted: false
            },
            _sum: { totalAmount: true }
        });
        const totalExpenses = Number(expenseAgg._sum.totalAmount || 0);
        // 4. RevPAR Calculation (Revenue Per Available Room)
        const totalUnitsCount = await prisma.unit.count({
            where: { propertyId, status: { not: 'BLOCKED' } }
        });
        // Total available room nights in this month
        const totalAvailableRoomNights = totalUnitsCount * daysInMonth;
        const revPAR = totalAvailableRoomNights > 0 ? (totalRevenue / totalAvailableRoomNights).toFixed(2) : 0;
        return res.status(200).json({
            data: {
                period: { month: month + 1, year },
                revenue: totalRevenue,
                pendingDues: totalPending,
                expenses: totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                metrics: {
                    revPAR: Number(revPAR),
                    totalAvailableRoomNights
                }
            }
        });
    }
    catch (error) {
        console.error('[Analytics: Financials]', error);
        return res.status(500).json({ error: 'Failed to generate financial stats.' });
    }
};
// ============================================================================
// 10.4: CSV EXPORT ENGINE
// ============================================================================
export const exportTransactionsCSV = async (req, res) => {
    try {
        const propertyId = parseInt(req.params.propertyId, 10);
        // Fetch last 30 days by default, or specific range if needed
        const transactions = await prisma.financialLedger.findMany({
            where: { propertyId, isDeleted: false },
            include: {
                account: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (transactions.length === 0) {
            return res.status(404).json({ error: 'No transactions found to export.' });
        }
        // Define CSV Headers
        const headers = ['Invoice Number', 'Date', 'Guest/Staff Name', 'Category', 'Type', 'Status', 'Total Amount', 'Paid Amount'];
        // Map data to CSV rows
        const rows = transactions.map(t => {
            const name = t.account ? `${t.account.firstName} ${t.account.lastName}` : 'N/A';
            const date = t.createdAt.toISOString().split('T')[0];
            return [
                t.invoiceNumber || 'N/A',
                date,
                name,
                t.category,
                t.transactionType,
                t.status,
                t.totalAmount,
                t.paidAmount
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        // Force browser to download as a file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_prop_${propertyId}_${Date.now()}.csv`);
        return res.status(200).send(csvContent);
    }
    catch (error) {
        console.error('[Analytics: Export]', error);
        return res.status(500).json({ error: 'Failed to generate CSV export.' });
    }
};
//# sourceMappingURL=analytics.controller.js.map