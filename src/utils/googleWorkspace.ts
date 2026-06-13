import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { Member, Donation, IncidentReport } from '../types';

// In-memory token cache as requested in security requirements
let cachedAccessToken: string | null = null;
let cachedUserEmail: string | null = null;

/**
 * Initiates Google OAuth popup with Google Sheets and Google Drive scopes
 */
export const connectGoogleWorkspace = async (): Promise<{ accessToken: string; email: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    provider.addScope('https://www.googleapis.com/auth/drive');
    
    // Trigger Firebase popup authentication
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google Workspace credentials.');
    }
    
    cachedAccessToken = credential.accessToken;
    cachedUserEmail = result.user.email || 'Connected Account';
    return { accessToken: cachedAccessToken, email: cachedUserEmail };
  } catch (error: any) {
    console.error('Google Workspace Authentication Error:', error);
    if (error.message?.includes('popup-blocked')) {
      throw new Error('Sign-In popup was blocked by your browser. Please allow popups or open this app in a new tab.');
    }
    throw error;
  }
};

/**
 * Gets the current cached token
 */
export const getCachedToken = (): string | null => cachedAccessToken;
export const getConnectedEmail = (): string | null => cachedUserEmail;

/**
 * Disconnect/Clear in-memory tokens safely
 */
export const disconnectGoogleWorkspace = () => {
  cachedAccessToken = null;
  cachedUserEmail = null;
};

/**
 * Standard fetch options with Auth headers
 */
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/**
 * Interface for files fetched from Google Drive
 */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

/**
 * Creates a Google Sheet spreadsheet
 */
export const createGoogleSheet = async (token: string, title: string): Promise<string> => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      properties: {
        title: title,
      },
    }),
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API Error while creating: ${errText}`);
  }
  
  const data = await response.json();
  return data.spreadsheetId;
};

/**
 * Appends rows of data to a Google Sheet
 */
export const appendToGoogleSheet = async (
  token: string,
  spreadsheetId: string,
  values: any[][]
): Promise<any> => {
  const range = 'Sheet1!A1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      values: values,
    }),
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API Error while appending data: ${errText}`);
  }
  
  return await response.json();
};

/**
 * Exports Member Registry list directly into a beautiful new Google Sheet
 */
export const exportMembersToGoogleSheet = async (token: string, members: Member[]): Promise<string> => {
  const dateStr = new Date().toLocaleDateString();
  const title = `OPC Member Registry Export - ${dateStr}`;
  const spreadsheetId = await createGoogleSheet(token, title);
  
  const headers = [
    'Membership ID',
    'Full Name',
    'Father Name',
    'CNIC/Passport No.',
    'District',
    'Phone',
    'WhatsApp',
    'Oman Address',
    'Occupation',
    'Emergency Contact',
    'Status',
    'Registration Date'
  ];
  
  const rows = members.map(m => [
    m.membershipId || 'Pending',
    m.name || '',
    m.father || '',
    m.cnic || '',
    m.district || '',
    m.phone || '',
    m.whatsapp || '',
    m.address || '',
    m.occupation || '',
    m.emergency || '',
    m.status || 'review',
    m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
  ]);
  
  await appendToGoogleSheet(token, spreadsheetId, [headers, ...rows]);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
};

/**
 * Exports Welfare Claim Incidents directly into a beautiful new Google Sheet
 */
export const exportIncidentsToGoogleSheet = async (token: string, incidents: IncidentReport[]): Promise<string> => {
  const dateStr = new Date().toLocaleDateString();
  const title = `OPC Welfare Claims Log - ${dateStr}`;
  const spreadsheetId = await createGoogleSheet(token, title);
  
  const headers = [
    'Claim ID',
    'Category/Type',
    'Claimant / Affected Individual',
    'Incident Description & Context',
    'Incident Date',
    'Reporter Phone',
    'Status',
  ];
  
  const rows = incidents.map(i => [
    i.id || '',
    i.type || '',
    i.name || '',
    i.description || '',
    i.date || '',
    i.contact || '',
    i.status || 'pendingReview'
  ]);
  
  await appendToGoogleSheet(token, spreadsheetId, [headers, ...rows]);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
};

/**
 * Exports Donations list directly into a beautiful new Google Sheet
 */
export const exportDonationsToGoogleSheet = async (token: string, donations: Donation[]): Promise<string> => {
  const dateStr = new Date().toLocaleDateString();
  const title = `OPC Donations Log Export - ${dateStr}`;
  const spreadsheetId = await createGoogleSheet(token, title);
  
  const headers = [
    'Donation Date',
    'Donor Name',
    'Amount (OMR)',
    'Payment Method',
    'Reference Log / Notes'
  ];
  
  const rows = donations.map(d => [
    d.date || '',
    d.donor || '',
    d.amount || '0',
    d.method || '',
    d.note || ''
  ]);
  
  await appendToGoogleSheet(token, spreadsheetId, [headers, ...rows]);
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
};

/**
 * Lists OPC files stored in Google Drive
 */
export const listOpcWorkspaceFiles = async (token: string): Promise<DriveFile[]> => {
  const queryParam = encodeURIComponent("name contains 'OPC' and trashed = false");
  const fields = 'files(id,name,webViewLink,mimeType,createdTime)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${queryParam}&fields=${fields}&orderBy=createdTime%20desc`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API Error while listing: ${errText}`);
  }
  
  const data = await response.json();
  return data.files || [];
};

/**
 * Multi-part upload of json data snapshot backup onto Google Drive
 */
export const uploadBackupToGoogleDrive = async (
  token: string,
  backupName: string,
  payload: any
): Promise<string> => {
  const metadata = {
    name: backupName,
    mimeType: 'application/json',
  };
  
  const fileContent = JSON.stringify(payload, null, 2);
  const boundary = 'OPC_BACKUP_BOUNDARY';
  
  const multipartBody = 
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${fileContent}\r\n` +
    `--${boundary}--`;
    
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API Upload Error: ${errText}`);
  }
  
  const result = await response.json();
  return result.id;
};

/**
 * Deletes a Google Drive file by ID (Requires prompt before/outside calling this)
 */
export const deleteGoogleDriveFile = async (token: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API Error during file deletion: ${errText}`);
  }
};

export interface PickerFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

/**
 * Loads the Google API client script and triggers the Google Picker interface
 */
export const openGooglePicker = (
  token: string,
  onPicked: (file: PickerFile) => void,
  onCancel?: () => void
) => {
  const loadPicker = () => {
    if (!(window as any).gapi) {
      console.error('Google API (gapi) script could not be loaded.');
      return;
    }
    (window as any).gapi.load('picker', {
      callback: () => {
        try {
          const pickerOrigin =
            window.location.ancestorOrigins &&
            window.location.ancestorOrigins.length > 0
              ? window.location.ancestorOrigins[
                  window.location.ancestorOrigins.length - 1
                ]
              : window.location.origin;

          const picker = new (window as any).google.picker.PickerBuilder()
            .addView((window as any).google.picker.ViewId.DOCS)
            .setOAuthToken(token)
            .setCallback((data: any) => {
              if (data.action === (window as any).google.picker.Action.PICKED) {
                const doc = data.docs[0];
                if (doc) {
                  onPicked({
                    id: doc.id,
                    name: doc.name,
                    url: doc.url || `https://drive.google.com/file/d/${doc.id}/view?usp=drivesdk`,
                    mimeType: doc.mimeType || '',
                  });
                }
              } else if (data.action === (window as any).google.picker.Action.CANCEL) {
                if (onCancel) onCancel();
              }
            })
            .setOrigin(pickerOrigin)
            .build();
          
          picker.setVisible(true);
        } catch (err) {
          console.error("Error creating Google Picker:", err);
        }
      }
    });
  };

  // If script not loaded, inject it dynamically
  if (!(window as any).gapi) {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.onload = loadPicker;
    document.body.appendChild(script);
  } else {
    loadPicker();
  }
};

