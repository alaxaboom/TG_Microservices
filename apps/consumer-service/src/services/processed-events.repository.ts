import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcessedEventsRepository {
  private readonly events = new Set<string>();

  isProcessed(eventId: string): boolean {
    return this.events.has(eventId);
  }

  markProcessed(eventId: string): void {
    this.events.add(eventId);
  }
}
