import { ProjectData, parseProjectJson } from './projectStorage';

const ONEDRIVE_TOKEN_KEY = 'mourne_onedrive_access_token';
const ONEDRIVE_USER_KEY = 'mourne_onedrive_user_info';
const ONEDRIVE_BACKUP_ENABLED_KEY = 'mourne_onedrive_autobackup_enabled';

// Standard Microsoft OAuth app or public SPA client
const MICROSOFT_CLIENT_ID = '00000000-0000-0000-0000-000000000000'; // Default SPA client placeholder or promptable

export interface OneDriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: number;
  downloadUrl?: string;
  isBackup?: boolean;
}

export interface OneDriveUser {
  displayName?: string;
  email?: string;
}

export const getOneDriveToken = (): string | null => {
  return localStorage.getItem(ONEDRIVE_TOKEN_KEY);
};

export const setOneDriveToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ONEDRIVE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ONEDRIVE_TOKEN_KEY);
  }
};

export const isOneDriveBackupEnabled = (): boolean => {
  return localStorage.getItem(ONEDRIVE_BACKUP_ENABLED_KEY) === 'true';
};

export const setOneDriveBackupEnabled = (enabled: boolean) => {
  localStorage.setItem(ONEDRIVE_BACKUP_ENABLED_KEY, enabled ? 'true' : 'false');
};

export const getOneDriveUser = (): OneDriveUser | null => {
  const data = localStorage.getItem(ONEDRIVE_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Connects to Microsoft OneDrive via OAuth Popup / Access Token Prompt
 */
export const authenticateOneDrive = async (manualToken?: string): Promise<string> => {
  if (manualToken) {
    setOneDriveToken(manualToken);
    // Fetch profile
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${manualToken}` }
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem(ONEDRIVE_USER_KEY, JSON.stringify({
          displayName: user.displayName || user.userPrincipalName,
          email: user.mail || user.userPrincipalName
        }));
      }
    } catch (e) {
      console.warn('OneDrive profile fetch failed:', e);
    }
    return manualToken;
  }

  // Popup flow for Microsoft Account OAuth
  return new Promise((resolve, reject) => {
    const redirectUri = window.location.origin;
    const scopes = encodeURIComponent('files.readwrite user.read offline_access');
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=d35907ce-6188-4447-9269-8dd3353e6d87&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(authUrl, 'OneDrive Authorization', `width=${width},height=${height},top=${top},left=${left}`);

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site or enter token manually.'));
      return;
    }

    const timer = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(timer);
          const token = getOneDriveToken();
          if (token) {
            resolve(token);
          } else {
            reject(new Error('OneDrive login window closed before completing.'));
          }
          return;
        }

        if (popup.location.href.includes('#access_token=') || popup.location.href.includes('?access_token=')) {
          const urlParams = new URLSearchParams(popup.location.hash.substring(1) || popup.location.search.substring(1));
          const accessToken = urlParams.get('access_token');
          if (accessToken) {
            setOneDriveToken(accessToken);
            popup.close();
            clearInterval(timer);
            resolve(accessToken);
          }
        }
      } catch (err) {
        // Cross-origin restriction while waiting for redirect
      }
    }, 500);
  });
};

export const disconnectOneDrive = () => {
  localStorage.removeItem(ONEDRIVE_TOKEN_KEY);
  localStorage.removeItem(ONEDRIVE_USER_KEY);
  localStorage.removeItem(ONEDRIVE_BACKUP_ENABLED_KEY);
};

/**
 * Saves or updates a project to OneDrive under app root / MasonMapEditor folder
 */
export const saveProjectToOneDrive = async (
  project: ProjectData,
  options: { isBackup?: boolean } = {}
): Promise<OneDriveFileInfo> => {
  let token = getOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive.');

  const safeName = (project.name || 'mason_world').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const extension = '.mason';
  const prefix = options.isBackup ? '[BACKUP]_' : '';
  const fileName = `${prefix}${safeName}_${project.id}${extension}`;

  const body = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });

  const endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor/${encodeURIComponent(fileName)}:/content`;

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectOneDrive();
      throw new Error('OneDrive token expired. Please reconnect.');
    }
    const errText = await res.text();
    throw new Error(`OneDrive upload failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    modifiedTime: data.lastModifiedDateTime || new Date().toISOString(),
    size: data.size,
    downloadUrl: data['@microsoft.graph.downloadUrl'],
    isBackup: options.isBackup
  };
};

/**
 * Lists project files on OneDrive
 */
export const listOneDriveProjects = async (): Promise<OneDriveFileInfo[]> => {
  const token = getOneDriveToken();
  if (!token) return [];

  const endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor:/children?$select=id,name,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) disconnectOneDrive();
    return [];
  }

  const data = await res.json();
  return (data.value || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    modifiedTime: item.lastModifiedDateTime,
    size: item.size,
    downloadUrl: item['@microsoft.graph.downloadUrl'],
    isBackup: item.name.startsWith('[BACKUP]')
  }));
};

/**
 * Loads a project file from OneDrive
 */
export const loadProjectFromOneDrive = async (fileInfo: OneDriveFileInfo): Promise<ProjectData> => {
  const token = getOneDriveToken();
  if (!token) throw new Error('Not connected to OneDrive.');

  let res: Response;
  if (fileInfo.downloadUrl) {
    res = await fetch(fileInfo.downloadUrl);
  } else {
    res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileInfo.id}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  if (!res.ok) throw new Error('Failed to download project content from OneDrive.');

  const text = await res.text();
  return parseProjectJson(text);
};
