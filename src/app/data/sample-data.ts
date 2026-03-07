import { WorkCenterDocument, WorkOrderDocument } from '../models/work-order.model';

/**
 * Today = Mar 7 2026
 *
 * Day view  → Feb 25 – Mar 17  (21 days, ±10 from today)
 * Week view → 8 weeks centered on current week
 * Month view→ Dec 2025 – May 2026
 *
 * ALL work orders below fall within the Day view window so they are
 * immediately visible on first load without any scroll needed.
 */

export const WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-genesis',   docType: 'workCenter', data: { name: 'Genesis Hardware' } },
  { docId: 'wc-rodriques', docType: 'workCenter', data: { name: 'Rodriques Electrics' } },
  { docId: 'wc-konsulting', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
  { docId: 'wc-mcmarrow',  docType: 'workCenter', data: { name: 'McMarrow Distribution' } },
  { docId: 'wc-spartan',   docType: 'workCenter', data: { name: 'Spartan Manufacturing' } },
];

export const WORK_ORDERS: WorkOrderDocument[] = [

  // ── Genesis Hardware — two non-overlapping orders ─────────────
  {
    docId: 'wo-centrix',
    docType: 'workOrder',
    data: { name: 'Centrix Ltd', workCenterId: 'wc-genesis', status: 'complete', startDate: '2026-02-26', endDate: '2026-03-04' },
  },
  {
    docId: 'wo-alpha',
    docType: 'workOrder',
    data: { name: 'Alpha Corp', workCenterId: 'wc-genesis', status: 'open', startDate: '2026-03-10', endDate: '2026-03-17' },
  },

  // ── Rodriques Electrics ───────────────────────────────────────
  {
    docId: 'wo-rodriques',
    docType: 'workOrder',
    data: { name: 'Rodriques Electrics', workCenterId: 'wc-rodriques', status: 'in-progress', startDate: '2026-03-01', endDate: '2026-03-14' },
  },

  // ── Konsulting Inc — two non-overlapping orders ───────────────
  {
    docId: 'wo-konsulting',
    docType: 'workOrder',
    data: { name: 'Konsulting Inc', workCenterId: 'wc-konsulting', status: 'in-progress', startDate: '2026-02-25', endDate: '2026-03-05' },
  },
  {
    docId: 'wo-compleks',
    docType: 'workOrder',
    data: { name: 'Compleks Systems', workCenterId: 'wc-konsulting', status: 'in-progress', startDate: '2026-03-06', endDate: '2026-03-17' },
  },

  // ── McMarrow Distribution ─────────────────────────────────────
  {
    docId: 'wo-mcmarrow',
    docType: 'workOrder',
    data: { name: 'McMarrow Distribution', workCenterId: 'wc-mcmarrow', status: 'blocked', startDate: '2026-03-07', endDate: '2026-03-12' },
  },

  // ── Spartan Manufacturing — two non-overlapping orders ────────
  {
    docId: 'wo-spartan-q1',
    docType: 'workOrder',
    data: { name: 'Q1 Production Run', workCenterId: 'wc-spartan', status: 'complete', startDate: '2026-02-25', endDate: '2026-03-06' },
  },
  {
    docId: 'wo-spartan-q2',
    docType: 'workOrder',
    data: { name: 'Q2 Production Run', workCenterId: 'wc-spartan', status: 'open', startDate: '2026-03-09', endDate: '2026-03-17' },
  },
];