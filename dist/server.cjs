var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var PORT = 3e3;
var adminAuth = null;
var projectId = process.env.VITE_FIREBASE_PROJECT_ID || "sporttrack-8d6f8";
var apiKey = process.env.VITE_FIREBASE_API_KEY || "";
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const adminApp = (0, import_app.initializeApp)({
      credential: (0, import_app.cert)(serviceAccount),
      projectId
    });
    adminAuth = (0, import_auth.getAuth)(adminApp);
    console.log("[Server] Firebase Admin SDK initialized with service account.");
  }
} catch (e) {
  console.warn("[Server] Firebase Admin initialization note:", e.message);
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.delete("/api/students/:studentId", async (req, res) => {
    const { studentId } = req.params;
    if (!studentId || typeof studentId !== "string") {
      return res.status(400).json({ success: false, message: "Invalid or missing student ID." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please ensure you are logged in."
      });
    }
    const idToken = authHeader.split("Bearer ")[1].trim();
    try {
      let callerUid = "";
      if (apiKey) {
        const verifyRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken })
          }
        );
        if (!verifyRes.ok) {
          return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication session. Please re-login."
          });
        }
        const verifyData = await verifyRes.json();
        callerUid = verifyData.users?.[0]?.localId || "";
      }
      if (!callerUid) {
        return res.status(401).json({
          success: false,
          message: "Unable to verify caller identity."
        });
      }
      const callerDocRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${callerUid}`,
        {
          headers: { Authorization: `Bearer ${idToken}` }
        }
      );
      if (!callerDocRes.ok) {
        return res.status(403).json({
          success: false,
          message: "Permission denied. Caller user profile not found."
        });
      }
      const callerDoc = await callerDocRes.json();
      const callerRole = callerDoc.fields?.role?.stringValue;
      if (callerRole !== "TEACHER" && callerRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Students are not permitted to delete accounts."
        });
      }
      const targetDocRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${studentId}`,
        {
          headers: { Authorization: `Bearer ${idToken}` }
        }
      );
      if (targetDocRes.ok) {
        const targetDoc = await targetDocRes.json();
        const targetRole = targetDoc.fields?.role?.stringValue;
        if (targetRole === "TEACHER" || targetRole === "ADMIN") {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Cannot delete a Teacher or Admin account via student deletion protocol."
          });
        }
      }
      const deleteDocRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${studentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` }
        }
      );
      if (!deleteDocRes.ok && deleteDocRes.status !== 404) {
        const errText = await deleteDocRes.text();
        console.warn("[Server] Firestore document deletion returned status:", deleteDocRes.status, errText);
      }
      let authDeleted = false;
      if (adminAuth) {
        try {
          await adminAuth.deleteUser(studentId);
          authDeleted = true;
          console.log(`[Server] Firebase Auth user ${studentId} permanently deleted.`);
        } catch (authErr) {
          if (authErr.code === "auth/user-not-found") {
            authDeleted = true;
          } else {
            console.warn("[Server] Firebase Admin Auth deletion notice:", authErr.message || authErr);
          }
        }
      }
      return res.json({
        success: true,
        message: "Student profile and authentication account permanently deleted.",
        firestoreDeleted: true,
        authDeleted
      });
    } catch (err) {
      console.error("[Server] Deletion error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An unexpected server error occurred during deletion."
      });
    }
  });
  app.post("/api/staff", async (req, res) => {
    const { name, email, phone, role, password, clientApiKey } = req.body;
    const effectiveApiKey = clientApiKey || apiKey;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }
    if (role !== "TEACHER" && role !== "ADMIN") {
      return res.status(400).json({ success: false, message: "Invalid role. Must be TEACHER or ADMIN." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in."
      });
    }
    const idToken = authHeader.split("Bearer ")[1].trim();
    try {
      let callerUid = "";
      if (adminAuth) {
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          callerUid = decoded.uid;
        } catch {
        }
      }
      if (!callerUid && effectiveApiKey) {
        try {
          const verifyRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${effectiveApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken })
            }
          );
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            callerUid = verifyData.users?.[0]?.localId || "";
          }
        } catch (verifyErr) {
          console.warn("[Server] Token verification warning:", verifyErr);
        }
      }
      if (!callerUid && idToken.includes(".")) {
        try {
          const parts = idToken.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
            callerUid = payload.user_id || payload.sub || "";
          }
        } catch {
        }
      }
      if (!callerUid) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired authentication session. Please sign in again."
        });
      }
      let callerRole = "";
      try {
        const callerDocRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${callerUid}`,
          {
            headers: { Authorization: `Bearer ${idToken}` }
          }
        );
        if (callerDocRes.ok) {
          const callerDoc = await callerDocRes.json();
          callerRole = callerDoc.fields?.role?.stringValue || "";
        }
      } catch (err) {
        console.warn("[Server] Caller role lookup warning:", err);
      }
      if (callerRole && callerRole !== "TEACHER" && callerRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Permission denied: Students are not permitted to manage or provision staff accounts."
        });
      }
      if (callerRole === "TEACHER" && role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Permission denied: Sports Teachers are not authorized to create Administrator accounts. Only Administrators can create Administrator accounts."
        });
      }
      let newUid = "";
      const trimmedName = name.trim();
      if (adminAuth) {
        try {
          const userRecord = await adminAuth.createUser({
            email: trimmedEmail,
            password,
            displayName: trimmedName
          });
          newUid = userRecord.uid;
        } catch (createErr) {
          if (createErr.code === "auth/email-already-exists") {
            return res.status(409).json({
              success: false,
              message: "An account with this email address already exists in Firebase Authentication."
            });
          }
          console.warn("[Server] adminAuth.createUser warning:", createErr.message || createErr);
        }
      }
      if (!newUid && effectiveApiKey) {
        try {
          const createRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${effectiveApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: trimmedEmail,
                password,
                returnSecureToken: true
              })
            }
          );
          if (!createRes.ok) {
            const errData = await createRes.json();
            const errMessage = errData.error?.message;
            if (errMessage === "EMAIL_EXISTS") {
              return res.status(409).json({
                success: false,
                message: "An account with this email address already exists in Firebase Authentication."
              });
            }
            console.warn("[Server] Identity Toolkit REST API note:", errMessage);
          } else {
            const createData = await createRes.json();
            newUid = createData.localId;
          }
        } catch (restErr) {
          console.warn("[Server] Identity Toolkit request warning:", restErr);
        }
      }
      if (!newUid) {
        newUid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const firestoreBody = {
        fields: {
          id: { stringValue: newUid },
          name: { stringValue: trimmedName },
          email: { stringValue: trimmedEmail },
          username: { stringValue: trimmedEmail.split("@")[0] },
          role: { stringValue: role },
          phone: { stringValue: phone ? phone.trim() : "" },
          active: { booleanValue: true },
          created_at: { stringValue: now }
        }
      };
      try {
        const firestoreRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${newUid}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify(firestoreBody)
          }
        );
        if (!firestoreRes.ok) {
          const errText = await firestoreRes.text();
          console.warn("[Server] Firestore document creation warning:", firestoreRes.status, errText);
        }
      } catch (fsErr) {
        console.warn("[Server] Firestore write network note:", fsErr);
      }
      return res.status(201).json({
        success: true,
        message: `Successfully provisioned ${role === "ADMIN" ? "Administrator" : "Sports Teacher"} account for ${trimmedName}.`,
        user: {
          id: newUid,
          name: trimmedName,
          email: trimmedEmail,
          username: trimmedEmail.split("@")[0],
          role,
          phone: phone ? phone.trim() : "",
          active: true,
          created_at: now
        }
      });
    } catch (err) {
      console.error("[Server] Staff account creation error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An unexpected server error occurred during staff creation."
      });
    }
  });
  app.delete("/api/staff/:staffId", async (req, res) => {
    const { staffId } = req.params;
    if (!staffId || typeof staffId !== "string") {
      return res.status(400).json({ success: false, message: "Invalid or missing staff ID." });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    const idToken = authHeader.split("Bearer ")[1].trim();
    try {
      let callerUid = "";
      if (adminAuth) {
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          callerUid = decoded.uid;
        } catch {
        }
      }
      if (!callerUid && apiKey) {
        const verifyRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken })
          }
        );
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          callerUid = verifyData.users?.[0]?.localId || "";
        }
      }
      if (!callerUid) {
        return res.status(401).json({ success: false, message: "Invalid or expired session." });
      }
      const callerDocRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${callerUid}`,
        {
          headers: { Authorization: `Bearer ${idToken}` }
        }
      );
      if (!callerDocRes.ok) {
        return res.status(403).json({ success: false, message: "Caller profile not found." });
      }
      const callerDoc = await callerDocRes.json();
      const callerRole = callerDoc.fields?.role?.stringValue;
      if (callerRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Permission denied: Sports Teachers and Students are not permitted to delete staff accounts. Only Administrators can manage staff."
        });
      }
      if (callerUid === staffId) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own active administrator account."
        });
      }
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${staffId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` }
        }
      );
      if (adminAuth) {
        try {
          await adminAuth.deleteUser(staffId);
        } catch (authErr) {
          console.warn("[Server] Admin Auth deletion note:", authErr.message);
        }
      }
      return res.json({
        success: true,
        message: "Staff account successfully deleted."
      });
    } catch (err) {
      console.error("[Server] Staff deletion error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An error occurred while deleting the staff account."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] SportTrack running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
