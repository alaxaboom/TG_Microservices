export interface LogContext {
  eventId?: string;
  service: string;
  details?: string;
}

export const formatLogMessage = (message: string, context: LogContext): string => {
  const eventPart = context.eventId ? ` eventId=${context.eventId}` : '';
  const detailsPart = context.details ? ` details=${context.details}` : '';
  return `[${context.service}] ${message}${eventPart}${detailsPart}`;
};
