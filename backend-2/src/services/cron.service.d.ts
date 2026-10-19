import { ReservationStatus } from '@prisma/client';
export declare const getReservationNoShowDeadline: (reservation: {
    expectedCheckIn: Date;
    expectedCheckOut?: Date | null;
}) => Date;
export declare const shouldMarkReservationNoShow: (reservation: {
    status: ReservationStatus;
    expectedCheckIn: Date;
    expectedCheckOut?: Date | null;
    unitAssignments: Array<{
        isActive: boolean;
    }>;
}, now?: Date) => boolean;
//# sourceMappingURL=cron.service.d.ts.map