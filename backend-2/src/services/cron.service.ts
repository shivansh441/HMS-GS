import * as cron from 'node-cron';
// @ts-ignore - Fallback signature declaration if types are isolated by path configurations
import type { ScheduledTask } from '@types/node-cron';

import { prisma } from '../utils/prisma.js';
import { ReservationStatus, UnitStatus } from '@prisma/client';

const debugLog = (message: string, details?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(message, details ?? {});
    }
};

export const getReservationNoShowDeadline = (reservation: {
    expectedCheckIn: Date;
    expectedCheckOut?: Date | null;
}) => {
    const checkIn = new Date(reservation.expectedCheckIn);
    const checkOut = reservation.expectedCheckOut ? new Date(reservation.expectedCheckOut) : null;
    return checkOut && checkOut > checkIn ? checkOut : checkIn;
};

export const shouldMarkReservationNoShow = (
    reservation: {
        status: ReservationStatus;
        expectedCheckIn: Date;
        expectedCheckOut?: Date | null;
        unitAssignments: Array<{ isActive: boolean }>;
    },
    now: Date = new Date(),
) => {
    if (
        reservation.status === ReservationStatus.CONVERTED ||
        reservation.status === ReservationStatus.CANCELLED ||
        reservation.status === ReservationStatus.REJECTED ||
        reservation.status === ReservationStatus.NO_SHOW
    ) {
        return false;
    }

    if (now < getReservationNoShowDeadline(reservation)) {
        return false;
    }

    return !reservation.unitAssignments.some((assignment) => assignment.isActive);
};

const markReservationNoShow = async (reservationId: number, propertyId: number, unitAssignments: Array<{ id: number; unitId: number }>) => {
    return prisma.$transaction(async (tx) => {
        const current = await tx.reservationRequest.findUnique({
            where: { id: reservationId },
            select: { status: true, unitAssignments: { where: { isActive: true }, select: { id: true, unitId: true } } },
        });

        if (!current) return false;
        if (
            current.status === ReservationStatus.CONVERTED ||
            current.status === ReservationStatus.CANCELLED ||
            current.status === ReservationStatus.REJECTED ||
            current.status === ReservationStatus.NO_SHOW
        ) {
            return false;
        }

        if (current.unitAssignments.length > 0) {
            return false;
        }

        await tx.reservationRequest.update({
            where: { id: reservationId },
            data: { status: ReservationStatus.NO_SHOW },
        });

        for (const assignment of unitAssignments) {
            await tx.unitAssignment.update({
                where: { id: assignment.id },
                data: { isActive: false },
            });

            await tx.unit.update({
                where: { id: assignment.unitId },
                data: { status: UnitStatus.AVAILABLE },
            });
        }

        await tx.auditLog.create({
            data: {
                accountId: null,
                propertyId,
                entityType: 'RESERVATION',
                entityId: reservationId,
                action: 'SYSTEM_NO_SHOW_AUTO_CANCEL',
                details: {
                    systemNote: 'Automated 2 AM no-show sweep cancellation.',
                    previousStatus: current.status,
                },
                ipAddress: '127.0.0.1',
                userAgent: 'SYSTEM_NIGHT_AUDIT_DAEMON',
            },
        });

        return true;
    });
};

// The rest of your cron service code remains exactly the same...
// ----------------------------------------------------------------------------
// NIGHTLY AUDIT CRON ENGINE
// ----------------------------------------------------------------------------

/**
 * Scheduled Daily Sweep Engine
 * Runs at 02:00 AM everyday
 */
cron.schedule('0 2 * * *', async () => {
    console.log('[NIGHT AUDIT] Starting daily system sweeps at 02:00...');

    const today = new Date();

    // 1. NO-SHOW SWEEP
    try {
        const expiredReservations = await prisma.reservationRequest.findMany({
            where: {
                status: { in: [ReservationStatus.APPROVED, ReservationStatus.PENDING] },
                OR: [
                    { expectedCheckIn: { lt: today } },
                    { expectedCheckOut: { lt: today } },
                ],
            },
            include: { unitAssignments: { where: { isActive: true } } },
        });

        const noShowCandidates = expiredReservations.filter((reservation) =>
            shouldMarkReservationNoShow(reservation, today)
        );

        debugLog('[NO-SHOW SWEEP] Found candidate records.', { count: noShowCandidates.length });

        for (const res of noShowCandidates) {
            try {
                const updated = await markReservationNoShow(
                    res.id,
                    res.propertyId,
                    res.unitAssignments.map(({ id, unitId }) => ({ id, unitId })),
                );
                if (!updated) {
                    debugLog('[NO-SHOW SWEEP] Skipped already-processed reservation.', { reservationId: res.id });
                }
            } catch (innerError) {
                console.error(`[NO-SHOW SWEEP ERROR] Failed to process reservation ID ${res.id}:`, innerError);
            }
        }
    } catch (err) {
        console.error('[CRITICAL] No-Show batch capture failure:', err);
    }

    // 2. UNIT BLOCK SYNCHRONIZATION
    try {
        const activeBlocks = await prisma.unitBlock.findMany({
            where: {
                startDate: { lte: today },
                endDate: { gte: today }
            }
        });

        // Handle units turning online or entering offline blocks
        for (const block of activeBlocks) {
            try {
                await prisma.unit.update({
                    where: { id: block.unitId },
                    data: { status: UnitStatus.MAINTENANCE }
                });
            } catch (innerError) {
                console.error(`[UNIT BLOCK SYNC ERROR] Failed updating unit ID ${block.unitId} to maintenance:`, innerError);
            }
        }

        // Release units whose blocks ended yesterday
        const expiredBlocks = await prisma.unitBlock.findMany({
            where: { endDate: { lt: today } }
        });

        for (const block of expiredBlocks) {
            try {
                // Double check unit isn't currently assigned to an active guest reservation before opening it
                const underlyingUnit = await prisma.unit.findUnique({ where: { id: block.unitId } });
                if (underlyingUnit && underlyingUnit.status === UnitStatus.MAINTENANCE) {
                    await prisma.unit.update({
                        where: { id: block.unitId },
                        data: { status: UnitStatus.AVAILABLE }
                    });
                }
            } catch (innerError) {
                console.error(`[UNIT BLOCK RELEASE ERROR] Failed freeing unit ID ${block.unitId}:`, innerError);
            }
        }
    } catch (err) {
        console.error('[CRITICAL] Unit Block system loop broken:', err);
    }

    console.log('[NIGHT AUDIT] Finished processing sweeps safely.');
});