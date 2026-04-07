// Event deduplication based on event_id and event_source
export function checkDuplicate(existingEvents, newEvent) {
  // Same event_name with same order_id from different source = duplicate
  const duplicate = existingEvents.find(e => 
    e.event_name === newEvent.event_name && 
    e.event_source !== newEvent.event_source &&
    e.order_id === newEvent.order_id
  );
  return duplicate ? true : false;
}

export function deduplicateEvents(events) {
  // Group by order_id + event_name, keep first non-deduplicated
  const grouped = {};
  const result = [];

  for (const event of events) {
    const key = `${event.order_id}:${event.event_name}`;
    if (!grouped[key]) {
      grouped[key] = event;
      if (!event.deduplicated) {
        result.push(event);
      }
    }
  }

  return result;
}

export function getDeduplicationStats(events) {
  const total = events.length;
  const deduplicated = events.filter(e => e.deduplicated).length;
  const bySource = {
    pixel: events.filter(e => e.event_source === 'pixel').length,
    capi: events.filter(e => e.event_source === 'capi').length
  };

  return {
    total,
    deduplicated,
    unique: total - deduplicated,
    by_source: bySource,
    ratio: total > 0 ? ((total - deduplicated) / total * 100).toFixed(1) : 100
  };
}
