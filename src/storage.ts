
// Local Storage implementation of a subset of Firestore API
type Callback = (snapshot: { docs: any[] }) => void;
const listeners: { [key: string]: Callback[] } = {};

const getCollectionData = (collectionName: string) => {
  const data = localStorage.getItem(`pirua_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

const setCollectionData = (collectionName: string, data: any[]) => {
  localStorage.setItem(`pirua_${collectionName}`, JSON.stringify(data));
  // Notify listeners
  if (listeners[collectionName]) {
    listeners[collectionName].forEach(cb => cb({ docs: data.map(d => ({ id: d.id, data: () => d })) }));
  }
};

export const db = {};

export const collection = (db: any, name: string) => name;

export const doc = (db: any, collectionName: string, id?: string) => ({ collectionName, id });

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const collectionData = getCollectionData(docRef.collectionName);
  const index = collectionData.findIndex((d: any) => d.id === docRef.id);
  
  let newData;
  if (index >= 0) {
    if (options?.merge) {
      newData = { ...collectionData[index], ...data };
    } else {
      newData = { ...data, id: docRef.id };
    }
    collectionData[index] = newData;
  } else {
    newData = { ...data, id: docRef.id };
    collectionData.push(newData);
  }
  
  setCollectionData(docRef.collectionName, collectionData);
};

export const updateDoc = async (docRef: any, data: any) => {
  const collectionData = getCollectionData(docRef.collectionName);
  const index = collectionData.findIndex((d: any) => d.id === docRef.id);
  if (index >= 0) {
    collectionData[index] = { ...collectionData[index], ...data };
    setCollectionData(docRef.collectionName, collectionData);
  }
};

export const deleteDoc = async (docRef: any) => {
  const collectionData = getCollectionData(docRef.collectionName);
  const filtered = collectionData.filter((d: any) => d.id !== docRef.id);
  setCollectionData(docRef.collectionName, filtered);
};

export const onSnapshot = (collectionName: string | any, callback: Callback) => {
  const name = typeof collectionName === 'string' ? collectionName : collectionName.collectionName;
  if (!listeners[name]) listeners[name] = [];
  listeners[name].push(callback);
  
  // Initial call
  const data = getCollectionData(name);
  callback({ docs: data.map((d: any) => ({ id: d.id, data: () => d })) });
  
  return () => {
    listeners[name] = listeners[name].filter(cb => cb !== callback);
  };
};

export const query = (col: any, ...args: any[]) => ({ collectionName: col });
export const where = (...args: any[]) => ({});

export const getDoc = async (docRef: any) => {
  const collectionData = getCollectionData(docRef.collectionName);
  const data = collectionData.find((d: any) => d.id === docRef.id);
  return {
    exists: () => !!data,
    data: () => data
  };
};

// Mock Auth
export const auth = {
  currentUser: { uid: 'local-user', email: 'admin@local', displayName: 'Administrador' }
};

export const googleProvider = {};
export const signInWithPopup = async () => ({ user: auth.currentUser });
export const signInWithRedirect = async () => {};
export const getRedirectResult = async () => null;
export const signOut = async () => {
  // In local mode, maybe we don't even need sign out, but let's keep it
};
export const onAuthStateChanged = (auth: any, callback: (user: any) => void) => {
  callback(auth.currentUser);
  return () => {};
};

export const handleFirestoreError = (err: any) => console.error(err);
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
