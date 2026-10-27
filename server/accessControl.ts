import { db } from './db';
import { AccessAdapterType } from '../src/types/index';

export interface HardwareCommandResult {
  success: boolean;
  stationCode: string;
  adapter: AccessAdapterType;
  action: 'CONNECT_RELAY' | 'DISCONNECT_RELAY' | 'PING' | 'REBOOT_STATION' | 'HDMI_CEC_SIGNAL';
  message: string;
  timestamp: string;
}

export class AccessControlManager {
  /**
   * Execute physical or simulated hardware control to allow gaming access to the PS4
   */
  public static async grantStationAccess(consoleId: string, sessionId: string): Promise<HardwareCommandResult> {
    const consoleObj = db.getConsoleById(consoleId);
    if (!consoleObj) {
      return {
        success: false,
        stationCode: consoleId,
        adapter: 'VIRTUAL_SIMULATOR',
        action: 'CONNECT_RELAY',
        message: 'Console station not found.',
        timestamp: new Date().toISOString(),
      };
    }

    // Connect relay / enable HDMI signal
    db.updateConsole(consoleObj.id, {
      relay_state: 'CONNECTED',
      status: 'occupied',
      current_session_id: sessionId,
      last_seen_at: new Date().toISOString(),
    });

    db.recordAccessEvent({
      sessionId,
      consoleId: consoleObj.id,
      eventType: 'ACCESS_GRANTED_RELAY_OPENED',
      result: 'SUCCESS',
      details: `[${consoleObj.access_adapter}] Command CONNECT_RELAY dispatched to ${consoleObj.ip_address} (${consoleObj.station_code}). PS4 HDMI/Power active.`,
    });

    return {
      success: true,
      stationCode: consoleObj.station_code,
      adapter: consoleObj.access_adapter,
      action: 'CONNECT_RELAY',
      message: `PS4 station ${consoleObj.station_code} access enabled via ${consoleObj.access_adapter}.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cut access (revoke HDMI display or controller relay) when timer expires or manual stop
   */
  public static async revokeStationAccess(
    consoleId: string,
    sessionId: string | null,
    reason = 'Timer expired'
  ): Promise<HardwareCommandResult> {
    const consoleObj = db.getConsoleById(consoleId);
    if (!consoleObj) {
      return {
        success: false,
        stationCode: consoleId,
        adapter: 'VIRTUAL_SIMULATOR',
        action: 'DISCONNECT_RELAY',
        message: 'Console station not found.',
        timestamp: new Date().toISOString(),
      };
    }

    db.updateConsole(consoleObj.id, {
      relay_state: 'DISCONNECTED',
      status: 'available',
      current_session_id: null,
      last_seen_at: new Date().toISOString(),
    });

    db.recordAccessEvent({
      sessionId,
      consoleId: consoleObj.id,
      eventType: 'ACCESS_REVOKED_RELAY_CUT',
      result: 'SUCCESS',
      details: `[${consoleObj.access_adapter}] Command DISCONNECT_RELAY dispatched to ${consoleObj.ip_address}. Reason: ${reason}. Display signal disabled.`,
    });

    return {
      success: true,
      stationCode: consoleObj.station_code,
      adapter: consoleObj.access_adapter,
      action: 'DISCONNECT_RELAY',
      message: `PS4 station ${consoleObj.station_code} access cut via ${consoleObj.access_adapter}.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Diagnostic ping / test command from Operator/Admin hardware simulator
   */
  public static async testStationAdapter(
    consoleId: string,
    action: 'CONNECT_RELAY' | 'DISCONNECT_RELAY' | 'PING' | 'REBOOT_STATION'
  ): Promise<HardwareCommandResult> {
    const consoleObj = db.getConsoleById(consoleId);
    if (!consoleObj) {
      throw new Error('Console not found');
    }

    const now = new Date().toISOString();
    let msg = '';

    if (action === 'CONNECT_RELAY') {
      db.updateConsole(consoleObj.id, { relay_state: 'CONNECTED', last_seen_at: now });
      msg = `Relay switched ON (Screen Active). Simulated current draw: 135 Watts.`;
    } else if (action === 'DISCONNECT_RELAY') {
      db.updateConsole(consoleObj.id, { relay_state: 'DISCONNECTED', last_seen_at: now });
      msg = `Relay switched OFF (Screen Cut). Standby current: 0.8 Watts.`;
    } else if (action === 'PING') {
      db.updateConsole(consoleObj.id, { last_seen_at: now });
      msg = `Station ${consoleObj.station_code} at ${consoleObj.ip_address} ping reply: 12ms (Online).`;
    } else if (action === 'REBOOT_STATION') {
      db.updateConsole(consoleObj.id, { relay_state: 'DISCONNECTED', last_seen_at: now });
      msg = `Power cycle pulse sent to ${consoleObj.station_code}.`;
    }

    db.recordAccessEvent({
      sessionId: consoleObj.current_session_id || null,
      consoleId: consoleObj.id,
      eventType: `MANUAL_ADAPTER_${action}`,
      result: 'SUCCESS',
      details: msg,
    });

    return {
      success: true,
      stationCode: consoleObj.station_code,
      adapter: consoleObj.access_adapter,
      action,
      message: msg,
      timestamp: now,
    };
  }
}
