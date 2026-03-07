export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';

export interface WorkCenterDocument {
  docId: string;
  docType: 'workCenter';
  data: {
    name: string;
  };
}

export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    /** References WorkCenterDocument.docId */
    workCenterId: string;
    status: WorkOrderStatus;
    /** ISO format e.g. "2026-02-15" */
    startDate: string;
    /** ISO format e.g. "2026-03-01" */
    endDate: string;
  };
}