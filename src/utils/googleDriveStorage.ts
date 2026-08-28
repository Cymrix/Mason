import { ProjectData, parseProjectJson } from './projectStorage';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Lazy initialize Firebase Auth
let authInstance: any = null;
const getFirebaseAuth = () => {
  if (!authInstance) {
    try {
      // Dynamic require/import or safe config check
      const firebaseConfig = {
        projectId: "peerless-robot-496902-g9",
        appId: "1:43198960631:web:65504cd6cb55d79e5cd4f2",
        apiKey: "AIzaSyCv6OcxA_rs1N-DQIJB4Ye45K3NJQw0Xs8",
        authDomain: "peerless-robot-496902-g9.firebaseapp.com",
        storageBucket: "peerless-robot-496902-g9.firebasestorage.app",
        messagingSenderId: "43198960631"
      };
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      authInstance = getAuth(app);
    } catch (e) {
      console.warn('Firebase Auth lazy initialization error:', e);
    }
  }
  return authInstance;
};

const GOOGLE_DRIVE_TOKEN_KEY = 'mourne_gdrive_access_token';
const GOOGLE_DRIVE_USER_KEY = 'mourne_gdrive_user_info';
const GOOGLE_DRIVE_FOLDER_ID_KEY = 'mourne_gdrive_folder_id';
const GOOGLE_DRIVE_FOLDER_NAME_KEY = 'mourne_gdrive_folder_name';

export interface DriveItem {
  id: string;
  name: string;
  isFolder: boolean;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  isBackup?: boolean;
}

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
 * Checks if Google Drive Auto-Backup is enabled (Always true when connected)
 */
export const isGoogleDriveBackupEnabled = (): boolean => {
  return true;
};

export const getGoogleDriveSelectedFolder = () => {
  return {
    id: localStorage.getItem(GOOGLE_DRIVE_FOLDER_ID_KEY) || null,
    name: localStorage.getItem(GOOGLE_DRIVE_FOLDER_NAME_KEY) || 'Root Directory'
  };
};

export const setGoogleDriveSelectedFolder = (id: string | null, name: string) => {
  if (id) {
    localStorage.setItem(GOOGLE_DRIVE_FOLDER_ID_KEY, id);
  } else {
    localStorage.removeItem(GOOGLE_DRIVE_FOLDER_ID_KEY);
  }
  localStorage.setItem(GOOGLE_DRIVE_FOLDER_NAME_KEY, name);
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
 * Triggers Google OAuth Client Token flow via Firebase Auth Popup or Google Identity Services
 */
export const authenticateGoogleDrive = async (manualToken?: string, customClientId?: string): Promise<string> => {
  if (manualToken && manualToken.trim()) {
    const cleanToken = manualToken.trim();
    setGoogleDriveToken(cleanToken);
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${cleanToken}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        localStorage.setItem(
          GOOGLE_DRIVE_USER_KEY,
          JSON.stringify({
            email: profile.email,
            name: profile.name,
            picture: profile.picture
          })
        );
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e);
    }
    return cleanToken;
  }

  // Method 1: Try Firebase Auth Popup (uses provisioned OAuth Client in firebase-applet-config.json)
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth unavailable');
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setGoogleDriveToken(credential.accessToken);
      const user = result.user;
      localStorage.setItem(
        GOOGLE_DRIVE_USER_KEY,
        JSON.stringify({
          email: user.email,
          name: user.displayName,
          picture: user.photoURL
        })
      );
      return credential.accessToken;
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase Auth popup failed or was bypassed, trying GIS client fallback:', firebaseErr);
  }

  // Method 2: Google Identity Services (GIS) fallback with provisioned oAuthClientId
  return new Promise((resolve, reject) => {
    const activeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const clientId =
      customClientId?.trim() ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      '966469177467-ovbndg35jpjah5gav69t0v4a41im8j8d.apps.googleusercontent.com';

    const triggerGis = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        try {
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope:
              'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (resp: any) => {
              if (resp.error) {
                if (resp.error === 'origin_mismatch' || resp.error_description?.includes('origin')) {
                  reject(
                    new Error(
                      `Origin Mismatch (Error 400): Authorized JavaScript origins in Google Cloud Console must include "${activeOrigin}" for client ID "${clientId}".`
                    )
                  );
                } else {
                  reject(new Error(resp.error_description || resp.error));
                }
                return;
              }
              if (resp.access_token) {
                setGoogleDriveToken(resp.access_token);
                try {
                  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${resp.access_token}` }
                  });
                  if (profileRes.ok) {
                    const profile = await profileRes.json();
                    localStorage.setItem(
                      GOOGLE_DRIVE_USER_KEY,
                      JSON.stringify({
                        email: profile.email,
                        name: profile.name,
                        picture: profile.picture
                      })
                    );
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
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          if ((window as any).google?.accounts?.oauth2) {
            triggerGis();
          } else {
            reject(new Error('Google Identity SDK failed to initialize.'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Google Accounts script.'));
        document.head.appendChild(script);
      }
    };

    triggerGis();
  });
};

/**
 * Disconnects Google Drive
 */
export const disconnectGoogleDrive = () => {
  localStorage.removeItem(GOOGLE_DRIVE_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_DRIVE_USER_KEY);
  localStorage.removeItem(GOOGLE_DRIVE_FOLDER_ID_KEY);
  localStorage.removeItem(GOOGLE_DRIVE_FOLDER_NAME_KEY);
};

/**
 * Lists items (folders and project files) inside a specific Google Drive directory for virtual browser
 */
export const listGoogleDriveFolderContents = async (folderId?: string | null): Promise<DriveItem[]> => {
  const token = getGoogleDriveToken();
  if (!token) return [];

  const parentId = folderId || 'root';
  const query = encodeURIComponent(`'${parentId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size)&orderBy=folder desc,modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) disconnectGoogleDrive();
    return [];
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    isFolder: f.mimeType === 'application/vnd.google-apps.folder',
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    size: f.size,
    isBackup: f.name.startsWith('[BACKUP]')
  }));
};

/**
 * Creates a new folder inside Google Drive
 */
export const createGoogleDriveFolder = async (folderName: string, parentFolderId?: string | null): Promise<DriveItem> => {
  const token = getGoogleDriveToken();
  if (!token) throw new Error('Not connected to Google Drive.');

  const parentId = parentFolderId || 'root';
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) throw new Error(`Could not create folder on Google Drive (${res.status})`);
  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    isFolder: true,
    mimeType: data.mimeType,
    modifiedTime: data.modifiedTime || new Date().toISOString()
  };
};

/**
 * Saves or updates a full project file to Google Drive
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

  const selectedFolder = getGoogleDriveSelectedFolder();
  const parentFolderId = selectedFolder.id || 'root';

  // Check if file already exists in target folder
  const query = encodeURIComponent(`name = '${fileName}' and '${parentFolderId}' in parents and trashed = false`);
  const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (checkRes.status === 401) {
    token = await authenticateGoogleDrive();
  }

  let fileId: string | null = null;
  if (checkRes.ok) {
    const data = await checkRes.json();
    if (data.files && data.files.length > 0) {
      fileId = data.files[0].id;
    }
  }

  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
    description: `Mason Map Editor Level - ${project.name} (${project.id})`
  };

  if (!fileId && parentFolderId) {
    metadata.parents = [parentFolderId];
  }

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
 * Lists all Mason projects stored on Google Drive in selected folder
 */
export const listGoogleDriveProjects = async (): Promise<DriveFileInfo[]> => {
  const token = getGoogleDriveToken();
  if (!token) return [];

  const items = await listGoogleDriveFolderContents(getGoogleDriveSelectedFolder().id);
  return items
    .filter(item => !item.isFolder && (item.name.endsWith('.mason') || item.name.endsWith('.json')))
    .map(item => ({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      modifiedTime: item.modifiedTime,
      size: item.size,
      isBackup: item.isBackup
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
