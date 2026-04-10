/**
 * Auto-Update System via GitHub
 * 
 * Cách hoạt động:
 * 1. GitHub Webhook: Khi push lên repo → GitHub gọi POST /api/webhooks/github-update
 * 2. Server xác thực chữ ký webhook (HMAC-SHA256)
 * 3. Server chạy: git pull → pnpm install → pnpm build → restart
 * 4. Polling: Mỗi giờ kiểm tra GitHub Releases API để phát hiện phiên bản mới
 */
import { exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import { getDb } from "./db";
import { userSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const execAsync = promisify(exec);

export interface UpdateLog {
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
}

// In-memory update logs (last 100 entries)
const updateLogs: UpdateLog[] = [];
let isUpdating = false;

function addLog(type: UpdateLog["type"], message: string) {
  const entry: UpdateLog = {
    timestamp: new Date().toISOString(),
    type,
    message,
  };
  updateLogs.unshift(entry);
  if (updateLogs.length > 100) updateLogs.pop();
  console.log(`[AutoUpdate][${type.toUpperCase()}] ${message}`);
}

export function getUpdateLogs(): UpdateLog[] {
  return [...updateLogs];
}

export function isUpdateInProgress(): boolean {
  return isUpdating;
}

/**
 * Xác thực chữ ký webhook từ GitHub
 */
export function verifyGithubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Lấy settings từ DB
 */
async function getSettings() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userSettings).limit(1);
  return rows[0] || null;
}

/**
 * Kiểm tra phiên bản mới trên GitHub Releases
 */
export async function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string | null; releaseNotes?: string }> {
  const settings = await getSettings();
  if (!settings?.githubRepo) {
    return { hasUpdate: false, latestVersion: null };
  }

  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "InvoicePrime-AutoUpdate/1.0",
    };
    if (settings.githubToken) {
      headers["Authorization"] = `token ${settings.githubToken}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${settings.githubRepo}/releases/latest`,
      { headers, signal: AbortSignal.timeout(15_000) }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // No releases yet - check tags instead
        const tagsRes = await fetch(
          `https://api.github.com/repos/${settings.githubRepo}/tags`,
          { headers, signal: AbortSignal.timeout(15_000) }
        );
        if (tagsRes.ok) {
          const tags = await tagsRes.json() as any[];
          if (tags.length > 0) {
            const latestTag = tags[0].name.replace(/^v/, "");
            const currentVersion = settings.currentVersion || "1.0.0";
            const hasUpdate = latestTag !== currentVersion;
            
    // Update DB
    const dbInst = await getDb();
    if (dbInst) {
      await dbInst.update(userSettings).set({
        latestVersion: latestTag,
        updateAvailable: hasUpdate,
        lastUpdateCheck: new Date(),
      }).where(eq(userSettings.id, settings.id));
    }

            return { hasUpdate, latestVersion: latestTag };
          }
        }
      }
      addLog("warning", `GitHub API returned ${response.status}`);
      return { hasUpdate: false, latestVersion: null };
    }

    const release = await response.json() as any;
    const latestVersion = (release.tag_name || "").replace(/^v/, "");
    const currentVersion = settings.currentVersion || "1.0.0";
    const hasUpdate = latestVersion && latestVersion !== currentVersion;

    // Update DB
    const dbInst2 = await getDb();
    if (dbInst2) {
      await dbInst2.update(userSettings).set({
        latestVersion: latestVersion || null,
        updateAvailable: !!hasUpdate,
        lastUpdateCheck: new Date(),
      }).where(eq(userSettings.id, settings.id));
    }

    addLog("info", `Version check: current=${currentVersion}, latest=${latestVersion}, hasUpdate=${hasUpdate}`);
    return { hasUpdate: !!hasUpdate, latestVersion, releaseNotes: release.body };
  } catch (err: any) {
    addLog("error", `Failed to check updates: ${err.message}`);
    return { hasUpdate: false, latestVersion: null };
  }
}

/**
 * Thực hiện cập nhật từ GitHub
 * Chạy: git pull → pnpm install → pnpm build → restart process
 */
export async function performUpdate(triggeredBy: "webhook" | "manual" = "manual"): Promise<{ success: boolean; message: string }> {
  if (isUpdating) {
    return { success: false, message: "Đang có quá trình cập nhật khác đang chạy" };
  }

  const settings = await getSettings();
  if (!settings?.githubRepo) {
    return { success: false, message: "Chưa cấu hình GitHub repository" };
  }

  isUpdating = true;
  addLog("info", `Starting update (triggered by: ${triggeredBy})`);

  try {
    const branch = settings.githubBranch || "main";
    const workDir = process.cwd();

    // Step 1: Git fetch & pull
    addLog("info", "Step 1/4: Fetching latest code from GitHub...");
    try {
      if (settings.githubToken) {
        // Set credentials for private repos
        const repoUrl = `https://${settings.githubToken}@github.com/${settings.githubRepo}.git`;
        await execAsync(`git remote set-url origin "${repoUrl}"`, { cwd: workDir });
      }
      await execAsync(`git fetch origin ${branch}`, { cwd: workDir, timeout: 60_000 });
      const { stdout: pullOut } = await execAsync(`git pull origin ${branch}`, { cwd: workDir, timeout: 60_000 });
      addLog("info", `Git pull: ${pullOut.trim().substring(0, 200)}`);
    } catch (err: any) {
      addLog("error", `Git pull failed: ${err.message}`);
      isUpdating = false;
      return { success: false, message: `Git pull thất bại: ${err.message}` };
    }

    // Step 2: Install dependencies
    addLog("info", "Step 2/4: Installing dependencies...");
    try {
      await execAsync("pnpm install --frozen-lockfile", { cwd: workDir, timeout: 120_000 });
      addLog("success", "Dependencies installed");
    } catch (err: any) {
      addLog("warning", `pnpm install warning: ${err.message.substring(0, 200)}`);
      // Continue even if install has warnings
    }

    // Step 3: Build
    addLog("info", "Step 3/4: Building application...");
    try {
      await execAsync("pnpm build", { cwd: workDir, timeout: 180_000 });
      addLog("success", "Build completed");
    } catch (err: any) {
      addLog("error", `Build failed: ${err.message.substring(0, 300)}`);
      isUpdating = false;
      return { success: false, message: `Build thất bại: ${err.message.substring(0, 200)}` };
    }

    // Step 4: Update version in DB
    addLog("info", "Step 4/4: Updating version info...");
    const newVersion = settings.latestVersion || settings.currentVersion || "1.0.0";
    const dbInst3 = await getDb();
    if (dbInst3) {
      await dbInst3.update(userSettings).set({
        currentVersion: newVersion,
        updateAvailable: false,
        lastUpdateAt: new Date(),
      }).where(eq(userSettings.id, settings.id));
    }

    addLog("success", `Update completed! Now running v${newVersion}`);
    isUpdating = false;

    // Step 5: Schedule restart (give time for response to be sent)
    setTimeout(() => {
      addLog("info", "Restarting server...");
      process.exit(0); // Process manager (PM2/Docker) will restart automatically
    }, 2000);

    return { success: true, message: `Cập nhật thành công lên v${newVersion}. Server sẽ khởi động lại trong vài giây.` };
  } catch (err: any) {
    addLog("error", `Unexpected error: ${err.message}`);
    isUpdating = false;
    return { success: false, message: `Lỗi không mong đợi: ${err.message}` };
  }
}

/**
 * Polling interval: kiểm tra phiên bản mới mỗi giờ
 */
let pollingInterval: ReturnType<typeof setInterval> | null = null;

export function startUpdatePolling() {
  if (pollingInterval) return;
  
  // Check immediately on start (after 30s delay)
  setTimeout(async () => {
    const settings = await getSettings().catch(() => null);
    if (settings?.githubRepo) {
      addLog("info", "Initial update check on startup");
      await checkForUpdates().catch(() => {});
    }
  }, 30_000);

  // Then check every hour
  pollingInterval = setInterval(async () => {
    const settings = await getSettings().catch(() => null);
    if (!settings?.githubRepo || !settings?.autoUpdate) return;
    
    addLog("info", "Scheduled update check");
    const result = await checkForUpdates().catch(() => ({ hasUpdate: false, latestVersion: null }));
    
    if (result.hasUpdate && settings.autoUpdate) {
      addLog("info", `Auto-update triggered: new version ${result.latestVersion} available`);
      await performUpdate("webhook").catch(err => {
        addLog("error", `Auto-update failed: ${err.message}`);
      });
    }
  }, 60 * 60 * 1000); // Every hour

  addLog("info", "Update polling started (interval: 1 hour)");
}

export function stopUpdatePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
