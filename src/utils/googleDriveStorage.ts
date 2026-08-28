import { ProjectData, parseProjectJson } from './projectStorage';

const GOOGLE_DRIVE_TOKEN_KEY = 'mourne_gdrive_access_token';
const GOOGLE_DRIVE_USER_KEY = 'mourne_gdrive_user_info';
const GOOGLE_DRIVE_BACKUP_ENABLED_KEY = 'mourne_gdrive_autobackup_enabled';

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  isBackup?: boolean;
}

export interface GoogleDriveUser {
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Gets cached Google Drive Access Token
 */
export const getGoogleDriveToken = (): string | null => {
  return localStorage.getItem(GOOGLE_DRIVE_TOKEN_KEY);
};

/**
 * Sets Google Drive Access Token
 */
export const setGoogleDriveToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(GOOGLE_DRIVE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GOOGLE_DRIVE_TOKEN_KEY);
  }
};

/**
 * Checks if Google Drive Auto-Backup is enabled
 */
export const isGoogleDriveBackupEnabled = (): boolean => {
  return localStorage.getItem(GOOGLE_DRIVE_BACKUP_ENABLED_KEY) === 'true';
};

/**
 * Sets Google Drive Auto-Backup preference
 */
export const setGoogleDriveBackupEnabled = (enabled: boolean) => {
  localStorage.setItem(GOOGLE_DRIVE_BACKUP_ENABLED_KEY, enabled ? 'true' : 'false');
};

/**
 * Retrieves Google User Info if logged in
 */
export const getGoogleDriveUser = (): GoogleDriveUser | null => {
  const data = localStorage.getItem(GOOGLE_DRIVE_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Triggers Google OAuth Client Token flow or allows token input
 */
export const authenticateGoogleDrive = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if Google OAuth Client GIS is loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '43198960631-apps.googleusercontent.com';
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId, // Google Workspace OAuth
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (resp: any) => {
            if (resp.error) {
              reject(new Error(resp.error_description || resp.error));
              return;
            }
            if (resp.access_token) {
              setGoogleDriveToken(resp.access_token);
              // Fetch profile info
              try {
                const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${resp.access_token}` }
                });
                if (profileRes.ok) {
                  const profile = await profileRes.json();
                  localStorage.setItem(GOOGLE_DRIVE_USER_KEY, JSON.stringify({
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture
                  }));
                }
              } catch (e) {
                console.warn('Could not fetch user profile:', e);
              }
              resolve(resp.access_token);
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    } else {
      // Fallback: load Google Identity Services script on demand
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if ((window as any).google?.accounts?.oauth2) {
          authenticateGoogleDrive().then(resolve).catch(reject);
        } else {
          reject(new Error('Google Identity SDK failed to initialize.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Accounts script.'));
      document.head.appendChild(script);
    }
  });
};

/**
 * Disconnects Google Drive
 */
export const disconnectGoogleDrive = () => {
  localStorage.removeItem(GOOGLE_DRIVE_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_DRIVE_USER_KEY);
  localStorage.removeItem(GOOGLE_DRIVE_BACKUP_ENABLED_KEY);
};

/**
 * Saves or updates a project file to Google Drive
 */
export const saveProjectToGoogleDrive = async (
  project: ProjectData,
  options: { isBackup?: boolean } = {}
): Promise<DriveFileInfo> => {
  let token = getGoogleDriveToken();
  if (!token) {
    token = await authenticateGoogleDrive();
  }

  const safeName = (project.name || 'mason_world').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const extension = '.mason';
  const prefix = options.isBackup ? '[BACKUP]_' : '';
  const fileName = `${prefix}${safeName}_${project.id}${extension}`;

  const bodyBlob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const mimeType = 'application/json';

  // Check if file already exists in Drive
  const query = encodeURIComponent(`name = '${fileName}' and trashed = false`);
  const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (checkRes.status === 401) {
    // Token expired, re-auth
    token = await authenticateGoogleDrive();
  }

  let fileId: string | null = null;
  if (checkRes.ok) {
    const data = await checkRes.json();
    if (data.files && data.files.length > 0) {
      fileId = data.files[0].id;
    }
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: `Mason Map Editor Level - ${project.name} (${project.id})`
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', bodyBlob);

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size';
  let method = 'POST';

  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive Upload Error: ${uploadRes.status} ${errText}`);
  }

  const result = await uploadRes.json();
  return {
    id: result.id,
    name: result.name,
    mimeType: result.mimeType,
    modifiedTime: result.modifiedTime || new Date().toISOString(),
    size: result.size,
    isBackup: options.isBackup
  };
};

/**
 * Lists all Mason projects stored on Google Drive
 */
export const listGoogleDriveProjects = async (): Promise<DriveFileInfo[]> => {
  const token = getGoogleDriveToken();
  if (!token) return [];

  const query = encodeURIComponent(`(name contains '.mason' or name contains '.json') and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectGoogleDrive();
    }
    return [];
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    size: f.size,
    isBackup: f.name.startsWith('[BACKUP]')
  }));
};

/**
 * Downloads and loads a project from Google Drive
 */
export const loadProjectFromGoogleDrive = async (fileId: string): Promise<ProjectData> => {
  const token = getGoogleDriveToken();
  if (!token) throw new Error('Not connected to Google Drive.');

  const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!fileRes.ok) throw new Error('Could not download file content from Google Drive.');

  const text = await fileRes.text();
  return parseProjectJson(text);
};
