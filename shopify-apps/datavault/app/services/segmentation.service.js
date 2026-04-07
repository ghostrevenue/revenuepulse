import * as segmentModel from '../segment.js';

export function getAllSegments(db, storeId) {
  return segmentModel.getSegments(db, storeId);
}

export function getSegment(db, storeId, segmentId) {
  return segmentModel.getSegmentById(db, storeId, segmentId);
}

export function createSegment(db, storeId, name, description, rules) {
  return segmentModel.createSegment(db, storeId, name, description, rules);
}

export function updateSegment(db, storeId, segmentId, name, description, rules) {
  return segmentModel.updateSegment(db, storeId, segmentId, name, description, rules);
}

export function deleteSegment(db, storeId, segmentId) {
  return segmentModel.deleteSegment(db, storeId, segmentId);
}

export function previewSegment(db, storeId, rules) {
  const count = segmentModel.countMatchingCustomers(db, storeId, rules);
  return { count };
}

export function getSegmentCustomers(db, storeId, segmentId, options = {}) {
  const segment = segmentModel.getSegmentById(db, storeId, segmentId);
  if (!segment) return [];
  
  const rules = JSON.parse(segment.rules || '[]');
  return segmentModel.getCustomersInSegment(db, storeId, rules, options);
}
