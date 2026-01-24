// Firebase Services for CRUD operations
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ==================== CLIENTS ====================
export const addClient = async (clientData) => {
  try {
    const docRef = await addDoc(collection(db, "clients"), {
      ...clientData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...clientData };
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};

export const getClients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "clients"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting clients:", error);
    throw error;
  }
};

export const getClient = async (clientId) => {
  try {
    const docRef = doc(db, "clients", clientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting client:", error);
    throw error;
  }
};

export const updateClient = async (clientId, clientData) => {
  try {
    const docRef = doc(db, "clients", clientId);
    await updateDoc(docRef, clientData);
    return { id: clientId, ...clientData };
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (clientId) => {
  try {
    await deleteDoc(doc(db, "clients", clientId));
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

// ==================== PETS ====================
export const addPet = async (petData) => {
  try {
    const docRef = await addDoc(collection(db, "pets"), {
      ...petData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...petData };
  } catch (error) {
    console.error("Error adding pet:", error);
    throw error;
  }
};

export const getPets = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "pets"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting pets:", error);
    throw error;
  }
};

export const getPetsByClient = async (clientId) => {
  try {
    const q = query(collection(db, "pets"), where("clientId", "==", clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting pets by client:", error);
    throw error;
  }
};

export const updatePet = async (petId, petData) => {
  try {
    const docRef = doc(db, "pets", petId);
    await updateDoc(docRef, petData);
    return { id: petId, ...petData };
  } catch (error) {
    console.error("Error updating pet:", error);
    throw error;
  }
};

export const deletePet = async (petId) => {
  try {
    await deleteDoc(doc(db, "pets", petId));
  } catch (error) {
    console.error("Error deleting pet:", error);
    throw error;
  }
};

// ==================== MEDICINES ====================
export const addMedicine = async (medicineData) => {
  try {
    const docRef = await addDoc(collection(db, "medicines"), {
      ...medicineData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...medicineData };
  } catch (error) {
    console.error("Error adding medicine:", error);
    throw error;
  }
};

export const getMedicines = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "medicines"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting medicines:", error);
    throw error;
  }
};

export const updateMedicine = async (medicineId, medicineData) => {
  try {
    const docRef = doc(db, "medicines", medicineId);
    await updateDoc(docRef, medicineData);
    return { id: medicineId, ...medicineData };
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw error;
  }
};

export const deleteMedicine = async (medicineId) => {
  try {
    await deleteDoc(doc(db, "medicines", medicineId));
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw error;
  }
};

// ==================== CONSULTATIONS ====================
export const addConsultation = async (consultationData) => {
  try {
    const docRef = await addDoc(collection(db, "consultations"), {
      ...consultationData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...consultationData };
  } catch (error) {
    console.error("Error adding consultation:", error);
    throw error;
  }
};

export const getConsultations = async () => {
  try {
    const q = query(
      collection(db, "consultations"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting consultations:", error);
    throw error;
  }
};

export const getConsultation = async (consultationId) => {
  try {
    const docRef = doc(db, "consultations", consultationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting consultation:", error);
    throw error;
  }
};

export const updateConsultation = async (consultationId, consultationData) => {
  try {
    const docRef = doc(db, "consultations", consultationId);
    await updateDoc(docRef, consultationData);
    return { id: consultationId, ...consultationData };
  } catch (error) {
    console.error("Error updating consultation:", error);
    throw error;
  }
};

export const deleteConsultation = async (consultationId) => {
  try {
    await deleteDoc(doc(db, "consultations", consultationId));
  } catch (error) {
    console.error("Error deleting consultation:", error);
    throw error;
  }
};

// ==================== FOLLOW UPS ====================
export const addFollowUp = async (followUpData) => {
  try {
    const docRef = await addDoc(collection(db, "followUps"), {
      ...followUpData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...followUpData };
  } catch (error) {
    console.error("Error adding follow-up:", error);
    throw error;
  }
};

export const getFollowUps = async () => {
  try {
    const q = query(collection(db, "followUps"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting follow-ups:", error);
    throw error;
  }
};

export const getFollowUpsByConsultation = async (consultationId) => {
  try {
    const q = query(
      collection(db, "followUps"),
      where("consultationId", "==", consultationId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting follow-ups by consultation:", error);
    throw error;
  }
};

// ==================== SUPPLIERS ====================
export const addSupplier = async (supplierData) => {
  try {
    const docRef = await addDoc(collection(db, "suppliers"), {
      ...supplierData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...supplierData };
  } catch (error) {
    console.error("Error adding supplier:", error);
    throw error;
  }
};

export const getSuppliers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "suppliers"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting suppliers:", error);
    throw error;
  }
};

export const updateSupplier = async (supplierId, supplierData) => {
  try {
    const docRef = doc(db, "suppliers", supplierId);
    await updateDoc(docRef, supplierData);
    return { id: supplierId, ...supplierData };
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw error;
  }
};

export const deleteSupplier = async (supplierId) => {
  try {
    await deleteDoc(doc(db, "suppliers", supplierId));
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
};

// ==================== PURCHASE ORDERS ====================
export const addPurchaseOrder = async (purchaseOrderData) => {
  try {
    const docRef = await addDoc(collection(db, "purchaseOrders"), {
      ...purchaseOrderData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...purchaseOrderData };
  } catch (error) {
    console.error("Error adding purchase order:", error);
    throw error;
  }
};

export const getPurchaseOrders = async () => {
  try {
    const q = query(
      collection(db, "purchaseOrders"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting purchase orders:", error);
    throw error;
  }
};

export const updatePurchaseOrder = async (
  purchaseOrderId,
  purchaseOrderData,
) => {
  try {
    const docRef = doc(db, "purchaseOrders", purchaseOrderId);
    await updateDoc(docRef, purchaseOrderData);
    return { id: purchaseOrderId, ...purchaseOrderData };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    throw error;
  }
};

export const deletePurchaseOrder = async (purchaseOrderId) => {
  try {
    await deleteDoc(doc(db, "purchaseOrders", purchaseOrderId));
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    throw error;
  }
};
