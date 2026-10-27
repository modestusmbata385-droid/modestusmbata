import React, { useState } from 'react';
import {
  X,
  FileCode,
  Terminal,
  Copy,
  CheckCircle2,
  Cpu,
  Layers,
  Shield,
  Download,
} from 'lucide-react';
import { Language } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface AndroidAppDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AndroidAppDocsModal: React.FC<AndroidAppDocsModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'service' | 'activity' | 'adb'>('manifest');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (key: string, code: string) => {
    soundManager.playClickSound();
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.playstation.kiosk">

    <!-- Permissions required for Game Monitoring & Device Kiosk -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.REORDER_TASKS" />

    <!-- Leanback TV Support -->
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />

    <application
        android:allowBackup="false"
        android:banner="@drawable/app_banner"
        android:icon="@mipmap/ic_launcher"
        android:label="PlayStation Kiosk"
        android:theme="@style/Theme.PlayStationKiosk.Fullscreen">

        <!-- Custom Kiosk Launcher Activity (Default Home on Android TV) -->
        <activity
            android:name=".KioskLauncherActivity"
            android:launchMode="singleTask"
            android:clearTaskOnLaunch="true"
            android:stateNotNeeded="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Background Game Monitoring Service -->
        <service
            android:name=".GameMonitorService"
            android:foregroundServiceType="specialUse"
            android:exported="false" />

        <!-- Device Administrator Receiver (for Device Owner / Kiosk Lock) -->
        <receiver
            android:name=".DeviceAdminReceiver"
            android:description="@string/device_admin_description"
            android:label="@string/device_admin_label"
            android:permission="android.permission.BIND_DEVICE_ADMIN"
            android:exported="true">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin_policies" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
            </intent-filter>
        </receiver>

        <!-- Auto-start on TV boot -->
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`;

  const monitorServiceCode = `package com.playstation.kiosk

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class GameMonitorService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isMonitoring = true

    // Synchronized state with Backend
    companion object {
        var allowedPackageName: String? = null
        var currentSessionId: String? = null
        var stationCode: String = "ATV-01"
        var backendUrl: String = "https://your-render-app.onrender.com/api/v1"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(101, createNotification())
        startPeriodicWatcher()
        return START_STICKY
    }

    private fun startPeriodicWatcher() {
        serviceScope.launch {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            while (isMonitoring) {
                delay(1000) // Poll every 1 second

                val currentForegroundApp = getForegroundPackage(usageStatsManager)
                val targetAllowed = allowedPackageName

                // If user is inside an active paid session and attempts an unapproved app
                if (targetAllowed != null && currentForegroundApp != null) {
                    val isApproved = currentForegroundApp == targetAllowed || 
                                     currentForegroundApp == packageName // allow our kiosk

                    if (!isApproved) {
                        Log.w("GameMonitor", "VIOLATION! Attempted: $currentForegroundApp, Allowed: $targetAllowed")
                        handleViolation(currentForegroundApp, targetAllowed)
                    }
                }
            }
        }
    }

    private fun getForegroundPackage(usageStatsManager: UsageStatsManager): String? {
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            time - 1000 * 5,
            time
        )
        if (stats.isNullOrEmpty()) return null

        var recentPkg: String? = null
        var lastUsedTime = 0L
        for (stat in stats) {
            if (stat.lastTimeUsed > lastUsedTime) {
                lastUsedTime = stat.lastTimeUsed
                recentPkg = stat.packageName
            }
        }
        return recentPkg
    }

    private fun handleViolation(attemptedPackage: String, allowedPackage: String) {
        // 1. Force return to Kiosk Launcher immediately
        val returnIntent = Intent(this, KioskLauncherActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            putExtra("VIOLATION_MESSAGE", "Mchezo huu haukuruhusiwa! Session ni ya $allowedPackage tu.")
        }
        startActivity(returnIntent)

        // 2. Report violation event to Backend API
        serviceScope.launch {
            try {
                val url = URL("$backendUrl/android-tv/violation")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("stationCode", stationCode)
                    put("attemptedPackage", attemptedPackage)
                    put("reason", "Player attempted to open unapproved app")
                }

                conn.outputStream.write(payload.toString().toByteArray())
                val code = conn.responseCode
                Log.d("GameMonitor", "Reported violation to backend, HTTP $code")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e("GameMonitor", "Failed to send violation to backend: \${e.message}")
            }
        }
    }

    private fun createNotification(): Notification {
        val channelId = "game_monitor_channel"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(channelId, "Kiosk Service", NotificationManager.IMPORTANCE_LOW)
        manager.createNotificationChannel(channel)

        return Notification.Builder(this, channelId)
            .setContentTitle("PlayStation Station Monitor Active")
            .setContentText("Kiosk & package lock active.")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isMonitoring = false
        serviceScope.cancel()
        super.onDestroy()
    }
}`;

  const activityCode = `package com.playstation.kiosk

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class KioskLauncherActivity : Activity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_kiosk_launcher)

        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)

        // If app is Device Owner, lock task mode (Kiosk Mode)
        if (dpm.isDeviceOwnerApp(packageName)) {
            dpm.setLockTaskPackages(adminComponent, arrayOf(packageName, "com.rockstargames.gtav", "com.ea.gp.fifamobile"))
            startLockTask() // Locks home, back, and status bar
        }

        // Start background monitor service
        startForegroundService(Intent(this, GameMonitorService::class.java))

        // Poll backend for newly paid sessions
        startBackendPolling()
    }

    private fun startBackendPolling() {
        scope.launch(Dispatchers.IO) {
            while (isActive) {
                delay(2000)
                try {
                    val stationCode = GameMonitorService.stationCode
                    val url = URL("\${GameMonitorService.backendUrl}/android-tv/station/$stationCode/active-session")
                    val conn = url.openConnection() as HttpURLConnection
                    val resp = conn.inputStream.bufferedReader().readText()
                    conn.disconnect()

                    val json = JSONObject(resp)
                    if (json.optBoolean("success")) {
                        val session = json.optJSONObject("session")
                        if (session != null && session.optString("status") == "active") {
                            val allowedPkg = session.optString("allowed_package")
                            GameMonitorService.allowedPackageName = allowedPkg
                            GameMonitorService.currentSessionId = session.optString("session_id")

                            withContext(Dispatchers.Main) {
                                launchAuthorizedGame(allowedPkg)
                            }
                        } else {
                            GameMonitorService.allowedPackageName = null
                        }
                    }
                } catch (e: Exception) {
                    // network retry
                }
            }
        }
    }

    private fun launchAuthorizedGame(packageName: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(launchIntent)
        }
    }

    override fun onBackPressed() {
        // Suppress back button in kiosk mode
    }
}`;

  const adbCode = `# 1. Sakinisha APK kwenye Android TV Box kwa kutumia ADB:
adb connect 192.168.1.103
adb install -r -g PlayStationKiosk.apk

# 2. Weka ruhusa ya kusoma app zilizopo foreground (Usage Stats):
adb shell pm grant com.playstation.kiosk android.permission.PACKAGE_USAGE_STATS

# 3. Weka app iwe Device Owner (Kuzuia mteja kutoka kwenye Kiosk):
adb shell dpm set-device-owner com.playstation.kiosk/.DeviceAdminReceiver

# 4. Set Kiosk kama default TV Launcher:
adb shell cmd package set-home-activity com.playstation.kiosk/.KioskLauncherActivity

# 5. Jaribu kuwasha TV:
adb shell am start -n com.playstation.kiosk/.KioskLauncherActivity`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <FileCode className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {lang === 'sw' ? 'Android TV App Source Code & Setup Guide' : 'Android TV App Source & Setup Guide'}
              </h3>
              <p className="text-xs text-slate-400">
                Custom Launcher + UsageStatsManager Foreground Monitor + Device Owner
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-slate-800 py-3 overflow-x-auto text-xs font-bold">
          {[
            { id: 'manifest', label: 'AndroidManifest.xml', icon: Layers },
            { id: 'service', label: 'GameMonitorService.kt', icon: Shield },
            { id: 'activity', label: 'KioskLauncherActivity.kt', icon: Cpu },
            { id: 'adb', label: 'ADB Setup Commands', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClickSound();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-y-auto py-4 font-mono text-xs text-slate-300">
          {activeTab === 'manifest' && (
            <div className="relative">
              <button
                onClick={() => copyCode('manifest', manifestCode)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 border border-slate-700"
              >
                {copiedKey === 'manifest' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'manifest' ? 'Copied!' : 'Copy XML'}</span>
              </button>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-blue-300">
                {manifestCode}
              </pre>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="relative">
              <button
                onClick={() => copyCode('service', monitorServiceCode)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 border border-slate-700"
              >
                {copiedKey === 'service' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'service' ? 'Copied!' : 'Copy Kotlin'}</span>
              </button>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-emerald-300">
                {monitorServiceCode}
              </pre>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="relative">
              <button
                onClick={() => copyCode('activity', activityCode)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 border border-slate-700"
              >
                {copiedKey === 'activity' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'activity' ? 'Copied!' : 'Copy Kotlin'}</span>
              </button>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-cyan-300">
                {activityCode}
              </pre>
            </div>
          )}

          {activeTab === 'adb' && (
            <div className="relative space-y-3">
              <button
                onClick={() => copyCode('adb', adbCode)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 flex items-center gap-1.5 border border-slate-700"
              >
                {copiedKey === 'adb' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'adb' ? 'Copied!' : 'Copy Commands'}</span>
              </button>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-yellow-300">
                {adbCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Android 9.0+ • Device Owner Mode Recommended for Production</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Funga / Close
          </button>
        </div>
      </div>
    </div>
  );
};
