const ENTRY_CUTOFF = new Date(2026, 3, 1, 12, 0, 0);

export const areEntriesClosed = () => new Date() >= ENTRY_CUTOFF;

export const getEntriesClosedMessage = () => 'Entries closed at 12:00pm on 1 April 2026.';
