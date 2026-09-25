/**
 * Administrator API Routes & Controller
 * Implements the authentication progression endpoints and the protected administrative dashboard APIs.
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const {
  createTemporarySession,
  getSession,
  verifySessionToken,
  advanceSessionStage,
  invalidateSession,
  createAdminSession,
  revokeAdminSession,
  verifyAdminToken,
  isRateLimited,
  recordFailedAttempt,
  getClientIp,
  getAuditLogs,
  logAuditEvent
} = require('./adminAuthSession');
const { verifySecretVoicePhrase } = require('./voiceVerification');
const { verifyAdminIdentity } = require('./adminIdentityVerification');
const { requireAdminAuth, extractAdminToken } = require('./adminRouteProtection');
const { resolveIpLocation } = require('../services/geoService');
const {
  loadMembers,
  loadApplications,
  approveCandidate,
  rejectCandidate,
  deleteRejectedApplication,
  loadWithdrawals,
  processWithdrawal,
  getSanitizedMembers,
  addMemberDirect,
  removeMember,
  regenerateMemberPassword,
  loadSocietyMessages
} = require('../services/secretSocietyService');

module.exports = function createAdminRouter(serverContext) {
  const { io, messages, saveMessages, userProfiles, saveProfile, activeUsers, deleteUploadedFile, jamesBot } = serverContext;

  // ----------------------------------------------------------------
  // 1. HIDDEN AUTHENTICATION FLOW ENDPOINTS
  // ----------------------------------------------------------------



  /**
   * STEP 1: Initiate temporary auth session after secret click gesture
   */
  router.post('/auth/initiate', (req, res) => {
    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Request throttled' });
    }

    const { clientNonce, socketId } = req.body || {};
    const result = createTemporarySession(ip, clientNonce, socketId);

    if (!result.success) {
      return res.status(400).json({ error: 'Unable to initiate' });
    }

    res.json({
      success: true,
      sessionId: result.sessionId,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt
    });
  });

  /**
   * STEP 2: Verify secret voice phrase ("I'm back buddy")
   */
  router.post('/auth/voice', (req, res) => {
    const ip = getClientIp(req);
    const { sessionId, sessionToken, phrase } = req.body || {};

    if (!sessionId || !sessionToken || !phrase) {
      return res.status(400).json({ success: false });
    }

    const session = getSession(sessionId);
    if (!session || session.stage !== 'INITIATED') {
      if (session) invalidateSession(sessionId);
      recordFailedAttempt(ip, 'Invalid session for voice check');
      return res.status(401).json({ success: false });
    }

    if (!verifySessionToken(session, sessionToken)) {
      invalidateSession(sessionId);
      recordFailedAttempt(ip, 'Invalid session token');
      return res.status(401).json({ success: false });
    }

    // Verify phrase against backend secret
    const isMatched = verifySecretVoicePhrase(phrase);

    if (isMatched) {
      const newToken = advanceSessionStage(session, 'VOICE_VERIFIED');
      logAuditEvent('VOICE_VERIFICATION_SUCCESS', {
        sessionId: sessionId.slice(0, 10) + '...'
      }, ip);

      return res.json({
        success: true,
        sessionToken: newToken
      });
    } else {
      session.voiceAttempts = (session.voiceAttempts || 0) + 1;
      if (session.voiceAttempts >= 20) {
        invalidateSession(sessionId);
        recordFailedAttempt(ip, 'Voice phrase mismatch limit exceeded');
        return res.status(401).json({ success: false, error: 'Maximum attempts exceeded' });
      }
      return res.status(200).json({ success: false, retry: true });
    }
  });

  /**
   * Check status of temporary authentication flow or active admin session
   */
  router.get('/auth/status', (req, res) => {
    // 1. Check if user already has an active Administrator session
    const adminToken = extractAdminToken(req);
    if (adminToken) {
      const adminSession = verifyAdminToken(adminToken);
      if (adminSession) {
        return res.json({
          authenticated: true,
          adminToken,
          username: adminSession.username,
          expiresAt: adminSession.expiresAt
        });
      }
    }

    // 2. Check temporary verification session status
    const sessionId = req.query.sessionId;
    const sessionToken = req.query.sessionToken;

    if (sessionId && sessionToken) {
      const session = getSession(sessionId);
      if (session && verifySessionToken(session, sessionToken)) {
        return res.json({
          authenticated: false,
          stage: session.stage,
          expiresAt: session.expiresAt
        });
      }
    }

    res.json({ authenticated: false, stage: null });
  });

  /**
   * STEP 4: Final Username Identity Verification
   */
  router.post('/auth/finalize', (req, res) => {
    const ip = getClientIp(req);
    const { sessionId, sessionToken, username } = req.body || {};

    if (!sessionId || !sessionToken || !username) {
      return res.status(400).json({ success: false });
    }

    const session = getSession(sessionId);
    if (!session || session.stage !== 'CHAT_VERIFIED') {
      if (session) invalidateSession(sessionId);
      recordFailedAttempt(ip, 'Finalize called outside of CHAT_VERIFIED stage');
      return res.status(401).json({ success: false });
    }

    if (!verifySessionToken(session, sessionToken)) {
      invalidateSession(sessionId);
      recordFailedAttempt(ip, 'Token mismatch on finalize');
      return res.status(401).json({ success: false });
    }

    const verificationResult = verifyAdminIdentity(session, username, ip);

    if (verificationResult.success) {
      // Set secure cookie
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
      res.cookie('st_admin_token', verificationResult.adminToken, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        adminToken: verificationResult.adminToken,
        username: verificationResult.username,
        expiresAt: verificationResult.expiresAt
      });
    } else {
      return res.status(401).json({ success: false });
    }
  });

  /**
   * Logout and revoke administrator session
   */
  router.post(['/auth/logout', '/dashboard/logout'], (req, res) => {
    const token = extractAdminToken(req);
    if (token) {
      revokeAdminSession(token);
    }
    res.clearCookie('st_admin_token');
    res.json({ success: true });
  });

  // ----------------------------------------------------------------
  // 2. PROTECTED ADMINISTRATOR DASHBOARD APIS (requireAdminAuth)
  // ----------------------------------------------------------------

  /**
   * Live Server Telemetry & System Status
   */
  router.get('/dashboard/telemetry', requireAdminAuth, (req, res) => {
    const memory = process.memoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    res.json({
      status: 'OPERATIONAL',
      serverTime: Date.now(),
      uptimeSeconds: Math.round(process.uptime()),
      systemUptimeSeconds: Math.round(os.uptime()),
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Standard CPU',
      loadAverage: loadAvg,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        externalMb: Math.round(memory.external / (1024 * 1024)),
        systemFreeMb: Math.round(os.freemem() / (1024 * 1024)),
        systemTotalMb: Math.round(os.totalmem() / (1024 * 1024))
      },
      network: {
        activeSockets: io.engine.clientsCount,
        trackedUsers: activeUsers.size
      },
      stats: {
        totalMessages: messages.length,
        totalRegisteredProfiles: userProfiles.size
      },
      jamesBot: {
        active: !!jamesBot,
        model: process.env.JAMES_MODEL || 'deepseek/deepseek-v4-flash',
        dailyStats: jamesBot?.memoryService?.dailyNewsStats || null
      }
    });
  });

  /**
   * User Profiles Management
   */
  router.get('/dashboard/users', requireAdminAuth, (req, res) => {
    const usersList = [];
    const seen = new Set();

    // Collect online users
    const onlineMap = new Map();
    for (const [sockId, u] of activeUsers.entries()) {
      if (u && (u.alias || u.userId)) {
        const k = (u.userId || u.alias).toLowerCase();
        if (!onlineMap.has(k)) onlineMap.set(k, []);
        onlineMap.get(k).push(sockId);
      }
    }

    for (const profile of userProfiles.values()) {
      if (!profile || !profile.alias) continue;
      const key = (profile.userId || profile.alias).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const sockets = onlineMap.get(key) || [];
      usersList.push({
        ...profile,
        activeSocketsCount: sockets.length,
        isCurrentlyConnected: sockets.length > 0
      });
    }

    res.json(usersList);
  });

  /**
   * Toggle user verified badge
   */
  router.post('/dashboard/user/verify', requireAdminAuth, (req, res) => {
    const { userId, alias, isVerified } = req.body || {};
    let profile = null;

    if (userId && userProfiles.has(userId)) profile = userProfiles.get(userId);
    else if (alias && userProfiles.has(alias.toLowerCase())) profile = userProfiles.get(alias.toLowerCase());

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    profile.isVerified = !!isVerified;
    profile.updatedAt = Date.now();
    saveProfile(profile);

    io.emit('userProfileUpdated', profile);
    io.emit('userVerified', { alias: profile.alias, isVerified: profile.isVerified });

    logAuditEvent('USER_VERIFICATION_TOGGLED', {
      alias: profile.alias,
      isVerified: profile.isVerified,
      admin: req.adminUsername
    }, getClientIp(req));

    res.json({ success: true, profile });
  });

  /**
   * Disconnect/Kick user sockets
   */
  router.post('/dashboard/user/kick', requireAdminAuth, (req, res) => {
    const { userId, alias } = req.body || {};
    let kickedSockets = 0;

    for (const [sockId, u] of activeUsers.entries()) {
      if (!u) continue;
      const match = (userId && u.userId === userId) || (alias && u.alias && u.alias.toLowerCase() === alias.toLowerCase());
      if (match) {
        const sock = io.sockets.sockets.get(sockId);
        if (sock) {
          sock.disconnect(true);
          kickedSockets++;
        }
      }
    }

    logAuditEvent('USER_KICKED', {
      target: alias || userId,
      kickedSockets,
      admin: req.adminUsername
    }, getClientIp(req));

    res.json({ success: true, kickedSockets });
  });

  /**
   * Delete user profile from database
   */
  router.post('/dashboard/user/delete', requireAdminAuth, (req, res) => {
    const { userId, alias } = req.body || {};
    if (userId) userProfiles.delete(userId);
    if (alias) userProfiles.delete(alias.toLowerCase());

    // Disconnect any active sockets for that user
    for (const [sockId, u] of activeUsers.entries()) {
      if (u && ((userId && u.userId === userId) || (alias && u.alias === alias))) {
        const sock = io.sockets.sockets.get(sockId);
        if (sock) sock.disconnect(true);
      }
    }

    logAuditEvent('USER_PROFILE_PURGED', {
      target: alias || userId,
      admin: req.adminUsername
    }, getClientIp(req));

    res.json({ success: true });
  });

  /**
   * Recent transmissions moderation feed
   */
  router.get('/dashboard/messages', requireAdminAuth, (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;
    res.json(messages.slice(-limit));
  });

  /**
   * Delete transmission by ID (moderation)
   */
  router.delete('/dashboard/message/:id', requireAdminAuth, (req, res) => {
    const msgId = req.params.id;
    const idx = messages.findIndex(m => String(m.id) === String(msgId));

    if (idx >= 0) {
      const deleted = messages.splice(idx, 1)[0];
      saveMessages(messages);

      // Delete file from disk if file attached
      if (deleted && deleted.fileUrl) {
        deleteUploadedFile(deleted.fileUrl);
      }

      io.emit('messageDeleted', { id: msgId });

      logAuditEvent('MESSAGE_MODERATED', {
        msgId,
        author: deleted?.alias,
        admin: req.adminUsername
      }, getClientIp(req));

      return res.json({ success: true });
    }

    res.status(404).json({ error: 'Message not found' });
  });

  /**
   * Administrative Emergency Broadcast to all chat terminals
   */
  router.post('/dashboard/broadcast', requireAdminAuth, (req, res) => {
    const { title, message: bodyText, level = 'info' } = req.body || {};

    if (!bodyText || !bodyText.trim()) {
      return res.status(400).json({ error: 'Broadcast message content required' });
    }

    const broadcastMsg = {
      id: 'admin_bcast_' + Date.now(),
      timestamp: Date.now(),
      alias: 'ROOT_AUTHORITY',
      userId: 'admin_root',
      color: '#ff0055',
      isVerified: true,
      text: `🚨 **ADMINISTRATIVE DIRECTIVE**: ${title || 'CRITICAL TRANSMISSION'}\n\n${bodyText.trim()}`,
      adminBroadcast: {
        title: title || 'ADMINISTRATIVE TRANSMISSION',
        content: bodyText.trim(),
        level, // 'critical' | 'alert' | 'info'
        issuedBy: req.adminUsername,
        issuedAt: Date.now()
      }
    };

    messages.push(broadcastMsg);
    saveMessages(messages);

    io.emit('message', broadcastMsg);
    io.emit('adminBroadcastAlert', broadcastMsg.adminBroadcast);

    logAuditEvent('EMERGENCY_BROADCAST_SENT', {
      title,
      level,
      admin: req.adminUsername
    }, getClientIp(req));

    res.json({ success: true, broadcastId: broadcastMsg.id });
  });

  /**
   * Trigger immediate James news broadcast or cleanup
   */
  router.post('/dashboard/james/trigger-news', requireAdminAuth, async (req, res) => {
    try {
      const category = req.body?.category || null;
      if (jamesBot && typeof jamesBot.broadcastNewsToRoom === 'function') {
        const result = await jamesBot.broadcastNewsToRoom(category);
        return res.json({ success: true, result });
      }
      res.status(503).json({ error: 'JamesBot not available' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Security audit logs
   */
  router.get('/dashboard/audit-logs', requireAdminAuth, (req, res) => {
    res.json(getAuditLogs());
  });

  // ----------------------------------------------------------------
  // 3. GEOLOCATION VISITOR TRACKING & IPSTACK TELEMETRY
  // ----------------------------------------------------------------
  router.get('/dashboard/geo-visitors', requireAdminAuth, async (req, res) => {
    try {
      const visitors = [];
      const seenIps = new Set();

      const societyMembers = loadMembers();
      const applications = loadApplications();

      // Common coordinate lookup for declared locations to display connection arc
      const KNOWN_GEO_COORDS = {
        'andhra pradesh': { lat: 16.5062, lon: 80.6480 },
        'hyderabad': { lat: 17.3850, lon: 78.4867 },
        'telangana': { lat: 17.3850, lon: 78.4867 },
        'zurich': { lat: 47.3769, lon: 8.5417 },
        'switzerland': { lat: 46.8182, lon: 8.2275 },
        'stockholm': { lat: 59.3293, lon: 18.0686 },
        'sweden': { lat: 60.1282, lon: 18.6435 },
        'delhi': { lat: 28.6139, lon: 77.2090 },
        'mumbai': { lat: 19.0760, lon: 72.8777 },
        'bengaluru': { lat: 12.9716, lon: 77.5946 },
        'bangalore': { lat: 12.9716, lon: 77.5946 },
        'london': { lat: 51.5074, lon: -0.1278 },
        'tokyo': { lat: 35.6762, lon: 139.6503 },
        'new york': { lat: 40.7128, lon: -74.0060 },
        'san francisco': { lat: 37.7749, lon: -122.4194 },
        'berlin': { lat: 52.5200, lon: 13.4050 },
        'paris': { lat: 48.8566, lon: 2.3522 },
        'singapore': { lat: 1.3521, lon: 103.8198 },
        'dubai': { lat: 25.2048, lon: 55.2708 }
      };

      const parseDeclaredCoords = (locStr) => {
        if (!locStr) return null;
        const lower = locStr.toLowerCase();
        for (const [key, coords] of Object.entries(KNOWN_GEO_COORDS)) {
          if (lower.includes(key)) {
            return coords;
          }
        }
        return null;
      };

      // 1. Resolve ONLY currently connected sockets (No offline users or dummy relays)
      for (const [sockId, u] of activeUsers.entries()) {
        const clientIp = u?.ip || '127.0.0.1';
        const geo = await resolveIpLocation(clientIp, u?.alias || sockId);
        if (geo) {
          seenIps.add(clientIp);

          // Find profile
          const userProf = (u?.userId && userProfiles.get(u.userId)) ||
                           (u?.alias && userProfiles.get(u.alias.toLowerCase())) ||
                           {};

          // Determine user Tier & Color
          const isAdmin = Boolean(geo.isCurrentAdmin || u?.isAdmin || userProf.role === 'admin' || userProf.isAdmin);
          const isMember = Boolean(!isAdmin && (
            societyMembers.some(m => m.alias && u?.alias && m.alias.toLowerCase() === u.alias.toLowerCase() && m.status === 'active') ||
            userProf.isSocietyMember ||
            userProf.isVerified
          ));

          let userTier = 'user';
          let tierColor = '#00f3ff'; // Normal user (Cyan)
          let tierLabel = 'Normal User';

          if (isAdmin) {
            userTier = 'admin';
            tierColor = '#fbbf24'; // Admin (Gold)
            tierLabel = 'Root Administrator';
          } else if (isMember) {
            userTier = 'member';
            tierColor = '#10b981'; // Secret Society Member (Emerald)
            tierLabel = 'Sovereign Enclave Member';
          }

          // If member: look up candidate application for entered declared location
          let declaredLocation = null;
          let declaredCoords = null;
          let locationRelation = null;

          if (isMember) {
            const app = applications.slice().reverse().find(a =>
              (a.alias && u?.alias && a.alias.toLowerCase() === u.alias.toLowerCase()) ||
              (a.userId && u?.userId && a.userId === u.userId)
            );
            if (app && app.ageLocation) {
              declaredLocation = app.ageLocation;
              declaredCoords = parseDeclaredCoords(app.ageLocation);

              // Analyze relationship
              const detectedCity = (geo.city || '').toLowerCase();
              const detectedRegion = (geo.region || '').toLowerCase();
              const detectedCountry = (geo.country || '').toLowerCase();
              const declLower = app.ageLocation.toLowerCase();

              if (declLower.includes(detectedCity) || declLower.includes(detectedRegion) || (detectedCountry && declLower.includes(detectedCountry))) {
                locationRelation = {
                  type: 'match',
                  status: 'VERIFIED REGIONAL MATCH',
                  summary: `Candidate declared "${app.ageLocation}" matching detected transmission telemetry (${geo.city || geo.region}, ${geo.country}).`,
                  badgeColor: '#10b981'
                };
              } else {
                locationRelation = {
                  type: 'discrepancy',
                  status: 'LOCATION DISCREPANCY / PROXY DETECTED',
                  summary: `Candidate declared "${app.ageLocation}", but current transmission originates from ${geo.city || geo.region}, ${geo.country}.`,
                  badgeColor: '#f59e0b'
                };
              }
            }
          }

          visitors.push({
            id: 'sock_' + sockId,
            socketId: sockId,
            alias: u?.alias || 'Anonymous Visitor',
            userId: u?.userId || 'guest_' + sockId.slice(0, 6),
            isOnline: true,
            ip: geo.ip,
            city: geo.city,
            region: geo.region || '',
            country: geo.country,
            countryCode: geo.countryCode,
            latitude: geo.latitude,
            longitude: geo.longitude,
            zip: geo.zip || '',
            timezone: geo.timezone || 'UTC',
            flag: geo.flag,
            isp: geo.isp,
            org: geo.org || geo.isp || '',
            asn: geo.asn || '',
            source: geo.source,
            isLocal: Boolean(geo.isLocal),
            isCurrentAdmin: isAdmin,
            exactVerified: Boolean(geo.exactVerified),
            connectedAt: u?.connectedAt || Date.now(),
            userTier,
            tierColor,
            tierLabel,
            declaredLocation,
            declaredCoords,
            locationRelation
          });
        }
      }

      res.json({
        success: true,
        visitors,
        activeSocketCount: activeUsers.size,
        totalTracked: visitors.length,
        ipstackConfigured: Boolean(process.env.IPSTACK_ACCESS_KEY || process.env.IPSTACK_API_KEY)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------------
  // 4. SECRET SOCIETY INDUCTION & MEMBERSHIP MANAGEMENT
  // ----------------------------------------------------------------
  router.get('/dashboard/society/applications', requireAdminAuth, (req, res) => {
    try {
      const apps = loadApplications();
      res.json(apps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/dashboard/society/approve', requireAdminAuth, async (req, res) => {
    try {
      const { applicationId, customPassphrase } = req.body || {};
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const result = await approveCandidate(applicationId, customPassphrase);
      logAuditEvent('SOCIETY_CANDIDATE_APPROVED', {
        applicationId,
        alias: result.alias,
        admin: req.adminUsername
      }, getClientIp(req));

      // Auto-update user profile: grant verified badge
      if (result.alias) {
        const lower = result.alias.toLowerCase();
        let prof = null;
        for (const p of userProfiles.values()) {
          if (p.alias && p.alias.toLowerCase() === lower) {
            prof = p;
            break;
          }
        }
        if (prof) {
          prof.isVerified = true;
          prof.isSocietyMember = true;
          prof.societyClearance = 'LEVEL-4 INDUCTED';
          saveProfile(prof);
          io.emit('userProfileUpdated', prof);
        }
      }

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/dashboard/society/reject', requireAdminAuth, (req, res) => {
    try {
      const { applicationId, reason } = req.body || {};
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const result = rejectCandidate(applicationId, reason);
      logAuditEvent('SOCIETY_CANDIDATE_REJECTED', {
        applicationId,
        admin: req.adminUsername
      }, getClientIp(req));

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Permanently delete a rejected application dossier
  router.post('/dashboard/society/application/delete', requireAdminAuth, (req, res) => {
    try {
      const { applicationId } = req.body || {};
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const result = deleteRejectedApplication(applicationId);
      logAuditEvent('SOCIETY_APPLICATION_DELETED', {
        applicationId,
        admin: req.adminUsername
      }, getClientIp(req));

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get member withdrawal requests
  router.get('/dashboard/society/withdrawals', requireAdminAuth, (req, res) => {
    try {
      const list = loadWithdrawals();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Approve member withdrawal & revoke membership + badge
  router.post('/dashboard/society/withdrawals/approve', requireAdminAuth, (req, res) => {
    try {
      const { withdrawalId } = req.body || {};
      if (!withdrawalId) return res.status(400).json({ error: 'Withdrawal ID is required' });

      const result = processWithdrawal(withdrawalId, 'approved');
      logAuditEvent('SOCIETY_WITHDRAWAL_APPROVED', {
        withdrawalId,
        alias: result.alias,
        admin: req.adminUsername
      }, getClientIp(req));

      // Revoke badge in user profile
      if (result.alias) {
        const lower = result.alias.toLowerCase();
        for (const p of userProfiles.values()) {
          if (p.alias && p.alias.toLowerCase() === lower) {
            p.isVerified = false;
            p.isSocietyMember = false;
            delete p.societyClearance;
            saveProfile(p);
            io.emit('userProfileUpdated', p);
            break;
          }
        }
      }

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Dismiss member withdrawal request
  router.post('/dashboard/society/withdrawals/dismiss', requireAdminAuth, (req, res) => {
    try {
      const { withdrawalId } = req.body || {};
      if (!withdrawalId) return res.status(400).json({ error: 'Withdrawal ID is required' });

      const result = processWithdrawal(withdrawalId, 'dismissed');
      logAuditEvent('SOCIETY_WITHDRAWAL_DISMISSED', {
        withdrawalId,
        admin: req.adminUsername
      }, getClientIp(req));

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/dashboard/society/members', requireAdminAuth, (req, res) => {
    try {
      const members = getSanitizedMembers();
      res.json(members);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/dashboard/society/member/add', requireAdminAuth, async (req, res) => {
    try {
      const result = await addMemberDirect(req.body || {});
      logAuditEvent('SOCIETY_MEMBER_ADDED_DIRECT', {
        alias: result.member?.alias,
        admin: req.adminUsername
      }, getClientIp(req));

      if (result.member?.alias) {
        const lower = result.member.alias.toLowerCase();
        let prof = null;
        for (const p of userProfiles.values()) {
          if (p.alias && p.alias.toLowerCase() === lower) {
            prof = p;
            break;
          }
        }
        if (prof) {
          prof.isVerified = true;
          prof.isSocietyMember = true;
          prof.societyClearance = result.member.clearance || 'LEVEL-4 INDUCTED';
          saveProfile(prof);
          io.emit('userProfileUpdated', prof);
        }
      }

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/dashboard/society/member/remove', requireAdminAuth, (req, res) => {
    try {
      const { memberId } = req.body || {};
      if (!memberId) return res.status(400).json({ error: 'Member ID is required' });

      const allMembers = loadMembers();
      const member = allMembers.find(m => m.id === memberId || m.alias.toLowerCase() === memberId.toLowerCase());
      const result = removeMember(memberId);

      logAuditEvent('SOCIETY_MEMBER_REVOKED', {
        memberId,
        admin: req.adminUsername
      }, getClientIp(req));

      if (member?.alias) {
        const lower = member.alias.toLowerCase();
        for (const p of userProfiles.values()) {
          if (p.alias && p.alias.toLowerCase() === lower) {
            p.isVerified = false;
            p.isSocietyMember = false;
            delete p.societyClearance;
            saveProfile(p);
            io.emit('userProfileUpdated', p);
            break;
          }
        }
      }

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/dashboard/society/member/regenerate-password', requireAdminAuth, async (req, res) => {
    try {
      const { memberId } = req.body || {};
      if (!memberId) return res.status(400).json({ error: 'Member ID is required' });

      const result = await regenerateMemberPassword(memberId);
      logAuditEvent('SOCIETY_PASSWORD_REGENERATED', {
        memberId,
        admin: req.adminUsername
      }, getClientIp(req));

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/dashboard/society/messages', requireAdminAuth, (req, res) => {
    try {
      const msgs = loadSocietyMessages();
      res.json(msgs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
