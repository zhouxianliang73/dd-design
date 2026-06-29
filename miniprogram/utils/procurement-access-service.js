/**
 * 采购询价可见性（未授权用户无任何 UI，不知道版块存在）
 * 1. 管理员将用户加入全局白名单
 * 2. 管理员为本项目授权（或用户经授权入口确认后写入）
 * 3. 项目 procurement.status === 'confirmed'
 * 三者齐备才显示「采购询价」版块
 */
var inquiryService = require('./inquiry-service');
var STORAGE_ADMINS = 'dd_procurement_admin_ids';
var STORAGE_GRANTED = 'dd_procurement_granted_viewers';
var STORAGE_PROJECT_GRANTS = 'dd_procurement_project_grants';

function getAdmins() {
  var list = wx.getStorageSync(STORAGE_ADMINS);
  return Array.isArray(list) ? list : [];
}

function getGrantedViewers() {
  var list = wx.getStorageSync(STORAGE_GRANTED);
  return Array.isArray(list) ? list : [];
}

function getProjectGrantsMap() {
  var map = wx.getStorageSync(STORAGE_PROJECT_GRANTS);
  return map && typeof map === 'object' ? map : {};
}

function getProjectGrantedViewers(projectToken) {
  if (!projectToken) return [];
  var map = getProjectGrantsMap();
  var list = map[projectToken];
  return Array.isArray(list) ? list : [];
}

function isAdmin(clientId) {
  if (!clientId) return false;
  return getAdmins().indexOf(clientId) >= 0;
}

function isGloballyGranted(clientId) {
  if (!clientId) return false;
  return getGrantedViewers().indexOf(clientId) >= 0;
}

function isProjectGranted(clientId, project) {
  if (!clientId || !project) return false;
  var token = project.token || project.id || '';
  var ids = getProjectGrantedViewers(token);
  if (!ids.length) return false;
  return ids.indexOf(clientId) >= 0;
}

function isProcurementConfirmed(project) {
  var proc = project && project.procurement;
  return proc && proc.status === 'confirmed';
}

/** 白名单 + 已发布（仅用于判断是否可发起授权，不展示版块） */
function canRequestProcurementAuth(clientId, project) {
  if (!clientId || !project) return false;
  if (!inquiryService.getInquiryDefs(project).length) return false;
  if (!isProcurementConfirmed(project)) return false;
  return isGloballyGranted(clientId);
}

/** 已点击本项目授权 → 可查看内容 */
function isProjectAuthorized(clientId, project) {
  return isProjectGranted(clientId, project);
}

function canViewProcurementContent(clientId, project) {
  if (!canRequestProcurementAuth(clientId, project)) return false;
  return isProjectAuthorized(clientId, project);
}

function authorizeProjectOnClick(clientId, projectToken) {
  if (!clientId || !projectToken) return false;
  if (!isGloballyGranted(clientId)) return false;
  var map = getProjectGrantsMap();
  var list = map[projectToken] || [];
  if (list.indexOf(clientId) < 0) list.push(clientId);
  map[projectToken] = list;
  wx.setStorageSync(STORAGE_PROJECT_GRANTS, map);
  return true;
}

function grantGlobalViewer(adminId, viewerId) {
  if (!isAdmin(adminId) || !viewerId) return false;
  var list = getGrantedViewers();
  if (list.indexOf(viewerId) < 0) list.push(viewerId);
  wx.setStorageSync(STORAGE_GRANTED, list);
  return true;
}

function grantProjectViewer(adminId, projectToken, viewerId) {
  if (!isAdmin(adminId) || !projectToken || !viewerId) return false;
  var map = getProjectGrantsMap();
  var list = map[projectToken] || [];
  if (list.indexOf(viewerId) < 0) list.push(viewerId);
  map[projectToken] = list;
  wx.setStorageSync(STORAGE_PROJECT_GRANTS, map);
  return true;
}

function confirmProcurementRelease(adminId, projectToken) {
  if (!isAdmin(adminId) || !projectToken) return false;
  return true;
}

function bootstrapDemo(clientId) {
  if (!clientId) return;
  var admins = getAdmins();
  if (!admins.length) {
    wx.setStorageSync(STORAGE_ADMINS, [clientId]);
    grantGlobalViewer(clientId, clientId);
  }
}

function bootstrapDemoAdminProjectGrant(clientId, projectToken) {
  if (!isAdmin(clientId) || !projectToken) return;
  grantProjectViewer(clientId, projectToken, clientId);
}

module.exports = {
  isAdmin: isAdmin,
  isGloballyGranted: isGloballyGranted,
  isProjectGranted: isProjectGranted,
  isProjectAuthorized: isProjectAuthorized,
  isProcurementConfirmed: isProcurementConfirmed,
  canRequestProcurementAuth: canRequestProcurementAuth,
  canViewProcurementContent: canViewProcurementContent,
  authorizeProjectOnClick: authorizeProjectOnClick,
  grantGlobalViewer: grantGlobalViewer,
  grantProjectViewer: grantProjectViewer,
  confirmProcurementRelease: confirmProcurementRelease,
  getProjectGrantedViewers: getProjectGrantedViewers,
  bootstrapDemo: bootstrapDemo,
  bootstrapDemoAdminProjectGrant: bootstrapDemoAdminProjectGrant
};
