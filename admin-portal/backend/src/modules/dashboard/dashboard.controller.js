// modules/dashboard/dashboard.controller.js
import * as dashboardService from './dashboard.service.js';

// GET /api/dashboard/summary
export async function getSummary(req, res) {
  res.status(200).json({ success: true, summary: await dashboardService.getSummary() });
}
