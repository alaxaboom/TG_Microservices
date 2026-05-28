import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcessedEventsRepository {
  private readonly processedEvents = new Map<string, Date>();

  isProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  markProcessed(eventId: string): void {
    this.processedEvents.set(eventId, new Date());
  }
}
