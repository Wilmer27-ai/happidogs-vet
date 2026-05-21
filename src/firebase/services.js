// Firebase Services for CRUD operations
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
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

// Alias for consistency
export const getClientById = getClient;

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

export const getPetById = async (petId) => {
  try {
    const docRef = doc(db, "pets", petId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting pet:", error);
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

export const updateMedicine = async (id, data) => {
  const ref = doc(db, 'medicines', id)
  await updateDoc(ref, data)
}

export const deleteMedicine = async (id) => {
  await deleteDoc(doc(db, 'medicines', id))
}

export const findMedicineByNameAndCategory = async (medicineName, category, brand = '') => {
  try {
    const medicines = await getMedicines()
    return medicines.find(m => 
      m.medicineName?.toLowerCase() === medicineName.toLowerCase() &&
      m.category?.toLowerCase() === category.toLowerCase() &&
      (brand === '' || m.brand?.toLowerCase() === brand.toLowerCase())
    ) || null
  } catch (error) {
    console.error("Error finding medicine:", error)
    return null
  }
}

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

// ==================== PET ACTIVITIES ====================
export const addPetActivity = async (activityData) => {
  try {
    const docRef = await addDoc(collection(db, "petActivities"), {
      ...activityData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...activityData };
  } catch (error) {
    console.error("Error adding pet activity:", error);
    throw error;
  }
};

export const getPetActivities = async (petId) => {
  try {
    const q = query(
      collection(db, "petActivities"),
      where("petId", "==", petId),
    );
    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by date in descending order (newest first) on the client side
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error getting pet activities:", error);
    throw error;
  }
};

// Get ALL pet activities (for reports)
export const getAllPetActivities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "petActivities"));
    const activities = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error getting all pet activities:", error);
    throw error;
  }
};

export const updatePetActivity = async (activityId, activityData) => {
  try {
    const docRef = doc(db, "petActivities", activityId);
    await updateDoc(docRef, activityData);
    return { id: activityId, ...activityData };
  } catch (error) {
    console.error("Error updating pet activity:", error);
    throw error;
  }
};

export const deletePetActivity = async (activityId) => {
  try {
    await deleteDoc(doc(db, "petActivities", activityId));
  } catch (error) {
    console.error("Error deleting pet activity:", error);
    throw error;
  }
};

// ==================== PET STORE ITEMS ====================
export const addStoreItem = async (itemData) => {
  try {
    const docRef = await addDoc(collection(db, "storeItems"), {
      ...itemData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...itemData };
  } catch (error) {
    console.error("Error adding store item:", error);
    throw error;
  }
};

export const getStoreItems = async () => {
  try {
    const snapshot = await getDocs(collection(db, "storeItems"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting store items:", error);
    throw error;
  }
};

export const updateStoreItem = async (id, data) => {
  const ref = doc(db, 'storeItems', id)
  await updateDoc(ref, data)
}

export const deleteStoreItem = async (id) => {
  await deleteDoc(doc(db, 'storeItems', id))
}

export const findStoreItemByNameAndCategory = async (itemName, category, brand = '') => {
  try {
    const storeItems = await getStoreItems()
    return storeItems.find(s => 
      s.itemName?.toLowerCase() === itemName.toLowerCase() &&
      s.category?.toLowerCase() === category.toLowerCase() &&
      (brand === '' || s.brand?.toLowerCase() === brand.toLowerCase())
    ) || null
  } catch (error) {
    console.error("Error finding store item:", error)
    return null
  }
}

// ==================== SALES ====================
export const addSale = async (saleData) => {
  try {
    const docRef = await addDoc(collection(db, "sales"), {
      ...saleData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...saleData };
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const getSales = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "sales"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting sales:", error);
    throw error;
  }
};

export const deleteSale = async (saleId) => {
  try {
    await deleteDoc(doc(db, "sales", saleId));
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};

// ==================== ACCESS ACCOUNTS ====================
export const createAccessInvite = async (inviteData) => {
  try {
    const docRef = await addDoc(collection(db, 'accessInvites'), {
      ...inviteData,
      active: true,
      used: false,
      createdAt: serverTimestamp(),
    })
    return { id: docRef.id, ...inviteData, active: true, used: false }
  } catch (error) {
    console.error('Error creating access invite:', error)
    throw error
  }
}

export const getAccessInvites = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'accessInvites'))
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0))
  } catch (error) {
    console.error('Error getting access invites:', error)
    throw error
  }
}

export const getAccessInviteByToken = async (token) => {
  try {
    const q = query(collection(db, 'accessInvites'), where('token', '==', token))
    const snapshot = await getDocs(q)
    const invite = snapshot.docs[0]
    return invite ? { id: invite.id, ...invite.data() } : null
  } catch (error) {
    console.error('Error getting access invite:', error)
    throw error
  }
}

export const updateAccessInvite = async (inviteId, data) => {
  try {
    const ref = doc(db, 'accessInvites', inviteId)
    await updateDoc(ref, data)
  } catch (error) {
    console.error('Error updating access invite:', error)
    throw error
  }
}

export const getAppUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'appUsers'))
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0))
  } catch (error) {
    console.error('Error getting app users:', error)
    throw error
  }
}

export const getAppUserByUid = async (uid) => {
  try {
    const docRef = doc(db, 'appUsers', uid)
    const snapshot = await getDoc(docRef)
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  } catch (error) {
    console.error('Error getting app user:', error)
    throw error
  }
}

export const setAppUserProfile = async (uid, data) => {
  try {
    const docRef = doc(db, 'appUsers', uid)
    await setDoc(docRef, data, { merge: true })
    return { id: uid, ...data }
  } catch (error) {
    console.error('Error saving app user profile:', error)
    throw error
  }
}

export const updateAppUserProfile = async (uid, data) => {
  try {
    const docRef = doc(db, 'appUsers', uid)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error('Error updating app user profile:', error)
    throw error
  }
}

export const deleteAppUserProfile = async (uid) => {
  try {
    await deleteDoc(doc(db, 'appUsers', uid))
  } catch (error) {
    console.error('Error deleting app user profile:', error)
    throw error
  }
}

export const voidSale = async (sale, reason = "Manual void") => {
  try {
    const saleId = sale.id;
    const type = sale.type;
    const items = sale.items;
    const itemId = sale.itemId;
    const quantity = sale.quantity ?? 0;
    const unit = sale.unit || '';
    
    if (type === 'consultation') {
      // For consultation sales, restore medicine stocks
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.medicineId) {
            // Get fresh medicine data
            const medRef = doc(db, "medicines", item.medicineId);
            const medSnap = await getDoc(medRef);
            
            if (medSnap.exists()) {
              const med = medSnap.data();
              const qty = item.quantity || 0;
              const itemUnit = item.unit || '';
              
              // Restore stock based on medicine type
              if (med.medicineType === 'syrup') {
                let mlToRestore = itemUnit === 'bottle' ? qty * (med.mlPerBottle ?? 0) : qty;
                let looseMl = med.looseMl ?? 0;
                let bottleCount = med.bottleCount ?? 0;
                
                looseMl += mlToRestore;
                const bottlesFromLoose = Math.floor(looseMl / (med.mlPerBottle ?? 1));
                bottleCount += bottlesFromLoose;
                looseMl = looseMl % (med.mlPerBottle ?? 1);
                
                console.log(`[VOID] Syrup: restored ${mlToRestore}ml, bottles=${bottleCount}, loose=${looseMl}`);
                
                await updateDoc(medRef, {
                  bottleCount,
                  looseMl,
                  stockQuantity: (bottleCount * (med.mlPerBottle ?? 0)) + looseMl,
                });
              } else if (med.medicineType === 'tablet') {
                let tabletsToRestore = itemUnit === 'box' ? qty * (med.tabletsPerBox ?? 0) : qty;
                let looseTablets = med.looseTablets ?? 0;
                let boxCount = med.boxCount ?? 0;
                
                looseTablets += tabletsToRestore;
                const boxesFromLoose = Math.floor(looseTablets / (med.tabletsPerBox ?? 1));
                boxCount += boxesFromLoose;
                looseTablets = looseTablets % (med.tabletsPerBox ?? 1);
                
                console.log(`[VOID] Tablet: restored ${tabletsToRestore} tablets, boxes=${boxCount}, loose=${looseTablets}`);
                
                await updateDoc(medRef, {
                  boxCount,
                  looseTablets,
                  stockQuantity: (boxCount * (med.tabletsPerBox ?? 0)) + looseTablets,
                });
              } else {
                const newStock = (med.stockQuantity ?? 0) + qty;
                console.log(`[VOID] Simple medicine: old=${med.stockQuantity}, +${qty}, new=${newStock}`);
                
                await updateDoc(medRef, {
                  stockQuantity: newStock,
                });
              }
            }
          }
        }
      }
    } else {
      // For petstore sales (medicine or store item), restore the item stock
      if (!itemId) {
        console.warn("[VOID] No itemId found in sale - cannot restore stock");
        throw new Error("Sale missing itemId for stock restoration");
      }
      
      const collectionName = sale.itemType === 'medicine' ? 'medicines' : 'storeItems';
      const itemRef = doc(db, collectionName, itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (itemSnap.exists()) {
        const item = itemSnap.data();
        const qty = quantity;
        const saleUnit = unit;
        
        console.log(`[VOID] Restoring ${qty} ${saleUnit} from ${collectionName}/${itemId}`);
        
        if (collectionName === 'medicines') {
          // Restore medicine stock
          if (item.medicineType === 'syrup') {
            let mlToRestore = saleUnit === 'bottle' ? qty * (item.mlPerBottle ?? 0) : qty;
            let looseMl = item.looseMl ?? 0;
            let bottleCount = item.bottleCount ?? 0;
            
            looseMl += mlToRestore;
            const bottlesFromLoose = Math.floor(looseMl / (item.mlPerBottle ?? 1));
            bottleCount += bottlesFromLoose;
            looseMl = looseMl % (item.mlPerBottle ?? 1);
            
            console.log(`[VOID] Petstore Syrup: ${mlToRestore}ml restore, bottles=${bottleCount}, loose=${looseMl}`);
            
            await updateDoc(itemRef, {
              bottleCount,
              looseMl,
              stockQuantity: (bottleCount * (item.mlPerBottle ?? 0)) + looseMl,
            });
          } else if (item.medicineType === 'tablet') {
            let tabletsToRestore = saleUnit === 'box' ? qty * (item.tabletsPerBox ?? 0) : qty;
            let looseTablets = item.looseTablets ?? 0;
            let boxCount = item.boxCount ?? 0;
            
            looseTablets += tabletsToRestore;
            const boxesFromLoose = Math.floor(looseTablets / (item.tabletsPerBox ?? 1));
            boxCount += boxesFromLoose;
            looseTablets = looseTablets % (item.tabletsPerBox ?? 1);
            
            console.log(`[VOID] Petstore Tablet: ${tabletsToRestore} tablets restore, boxes=${boxCount}, loose=${looseTablets}`);
            
            await updateDoc(itemRef, {
              boxCount,
              looseTablets,
              stockQuantity: (boxCount * (item.tabletsPerBox ?? 0)) + looseTablets,
            });
          } else {
            const newStock = (item.stockQuantity ?? 0) + qty;
            console.log(`[VOID] Petstore Medicine: old=${item.stockQuantity}, +${qty}, new=${newStock}`);
            
            await updateDoc(itemRef, {
              stockQuantity: newStock,
            });
          }
        } else {
          // Restore store item stock
          const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food'];
          if (foodCategories.includes(item.category)) {
            let kgToRestore = saleUnit === 'sack' ? qty * (item.kgPerSack ?? 0) : qty;
            let looseKg = item.looseKg ?? 0;
            let sacksCount = item.sacksCount ?? 0;
            
            looseKg += kgToRestore;
            const sacksFromLoose = Math.floor(looseKg / (item.kgPerSack ?? 1));
            sacksCount += sacksFromLoose;
            looseKg = looseKg % (item.kgPerSack ?? 1);
            
            console.log(`[VOID] Food: ${kgToRestore}kg restore, sacks=${sacksCount}, loose=${looseKg}`);
            
            await updateDoc(itemRef, {
              sacksCount,
              looseKg,
              stockQuantity: (sacksCount * (item.kgPerSack ?? 0)) + looseKg,
            });
          } else {
            const newStock = (item.stockQuantity ?? 0) + qty;
            console.log(`[VOID] Store Item: old=${item.stockQuantity}, +${qty}, new=${newStock}`);
            
            await updateDoc(itemRef, {
              stockQuantity: newStock,
            });
          }
        }
      } else {
        console.warn(`[VOID] Item not found: ${itemId} in ${collectionName}`);
        throw new Error(`Item not found for void operation: ${itemId}`);
      }
    }
    
    // Mark the sale as voided instead of deleting it
    await updateDoc(doc(db, "sales", saleId), {
      status: 'void',
      voidedAt: serverTimestamp(),
      voidReason: reason,
    });
    
    // Log the void action in stock edit history
    await logStockEdit({
      action: 'void',
      saleId,
      saleType: type || 'unknown',
      itemName: sale.medicineName || sale.itemName || 'Unknown',
      itemType: sale.itemType || 'unknown',
      quantity,
      unit,
      reason,
      voidDate: new Date().toISOString(),
    });
    
    console.log(`[VOID] Sale ${saleId} successfully voided`);
    
  } catch (error) {
    console.error("Error voiding sale:", error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================
// Helper function to calculate available selling units
export const calculateAvailableUnits = (item) => {
  if (!item.packageSize || !item.sellingUnit) {
    return item.stockQuantity; // Fallback to regular quantity
  }

  // Example: 10 sacks × 25kg per sack = 250kg available to sell
  return item.stockQuantity * item.packageSize;
};

// Helper function to calculate packages needed
export const calculatePackagesNeeded = (sellingQuantity, packageSize) => {
  return Math.ceil(sellingQuantity / packageSize);
};

// ==================== EXPENSES ====================
export const addExpense = async (expenseData) => {
  try {
    const docRef = await addDoc(collection(db, "expenses"), {
      ...expenseData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...expenseData };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const getExpenses = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "expenses"), orderBy("expenseDate", "desc")),
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting expenses:", error);
    throw error;
  }
};

export const updateExpense = async (expenseId, expenseData) => {
  try {
    const docRef = doc(db, "expenses", expenseId);
    await updateDoc(docRef, expenseData);
    return { id: expenseId, ...expenseData };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    await deleteDoc(doc(db, "expenses", expenseId));
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const savePetActivity = async (activityData) => {
  const { collection, addDoc } = await import('firebase/firestore')
  const { db } = await import('./config')
  const docRef = await addDoc(collection(db, 'petActivities'), {
    ...activityData,
    createdAt: new Date().toISOString()
  })
  return { id: docRef.id, ...activityData }
}

export const saveConsultationSession = async (consultationId, { clientId, clientName, date, petIds }) => {
  const { collection, addDoc } = await import('firebase/firestore')
  const { db } = await import('./config')
  await addDoc(collection(db, 'consultations'), {
    consultationId,
    clientId,
    clientName,
    date,
    petIds,
    createdAt: new Date().toISOString()
  })
}

export const getConsultations = async () => {
  const { collection, getDocs, orderBy, query } = await import('firebase/firestore')
  const { db } = await import('./config')
  const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const deleteConsultation = async (id) => {
  const { doc, deleteDoc } = await import('firebase/firestore')
  const { db } = await import('./config')
  await deleteDoc(doc(db, 'consultations', id))
}

export const deductMedicineStock = async (medicineId, quantity, unit, medicine) => {
  const { doc, updateDoc } = await import('firebase/firestore')
  const { db } = await import('./config')
  const ref = doc(db, 'medicines', medicineId)

  let updates = {}

  if (medicine.medicineType === 'syrup') {
    if (unit === 'bottle') {
      const totalMl = quantity * (medicine.mlPerBottle ?? 0)
      let looseMl = (medicine.looseMl ?? 0) - totalMl
      let bottleCount = medicine.bottleCount ?? 0
      while (looseMl < 0 && bottleCount > 0) {
        bottleCount -= 1
        looseMl += medicine.mlPerBottle ?? 0
      }
      updates = { bottleCount: Math.max(0, bottleCount), looseMl: Math.max(0, looseMl) }
    } else {
      // per ml
      let looseMl = (medicine.looseMl ?? 0) - quantity
      let bottleCount = medicine.bottleCount ?? 0
      while (looseMl < 0 && bottleCount > 0) {
        bottleCount -= 1
        looseMl += medicine.mlPerBottle ?? 0
      }
      updates = { bottleCount: Math.max(0, bottleCount), looseMl: Math.max(0, looseMl) }
    }
  } else if (medicine.medicineType === 'tablet') {
    if (unit === 'box') {
      const totalTabs = quantity * (medicine.tabletsPerBox ?? 0)
      let looseTablets = (medicine.looseTablets ?? 0) - totalTabs
      let boxCount = medicine.boxCount ?? 0
      while (looseTablets < 0 && boxCount > 0) {
        boxCount -= 1
        looseTablets += medicine.tabletsPerBox ?? 0
      }
      updates = { boxCount: Math.max(0, boxCount), looseTablets: Math.max(0, looseTablets) }
    } else {
      // per tablet
      let looseTablets = (medicine.looseTablets ?? 0) - quantity
      let boxCount = medicine.boxCount ?? 0
      while (looseTablets < 0 && boxCount > 0) {
        boxCount -= 1
        looseTablets += medicine.tabletsPerBox ?? 0
      }
      updates = { boxCount: Math.max(0, boxCount), looseTablets: Math.max(0, looseTablets) }
    }
  } else {
    updates = { stockQuantity: Math.max(0, (medicine.stockQuantity ?? 0) - quantity) }
  }

  await updateDoc(ref, updates)
}

export const saveSalesRecord = async (data) => {
  try {
    await addDoc(collection(db, 'sales'), {
      ...data,
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('saveSalesRecord error:', e)
    throw e
  }
}

// ==================== STOCK EDIT HISTORY ====================
export const logStockEdit = async (logData) => {
  try {
    const docRef = await addDoc(collection(db, 'stockEditHistory'), {
      ...logData,
      createdAt: serverTimestamp(),
    })
    return { id: docRef.id, ...logData }
  } catch (error) {
    console.error('Error logging stock edit:', error)
    throw error
  }
}

export const getStockEditHistory = async () => {
  try {
    const q = query(collection(db, 'stockEditHistory'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting stock edit history:', error)
    throw error
  }
}

// ==================== MASTER DATA ====================
export const MASTER_DATA_DEFAULTS = {
  consultationFee: 300,
  medicineCategories: ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care'],
  storeCategories: ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other'],
  activityTypes: ['Consultation', 'Vaccination', 'Deworming'],
  petSpecies: ['Canine', 'Feline', 'Avian', 'Rabbit', 'Guinea Pig', 'Hamster', 'Reptile', 'Fish', 'Other'],
  petBreeds: ['Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Dachshund', 'Siberian Husky', 'Boxer', 'Persian', 'Maine Coon', 'Siamese', 'Bengal', 'Ragdoll', 'Cockatiel', 'Budgie', 'Other'],
  packUnits: ['bottle', 'box', 'sack', 'vial', 'ampoule', 'sachet', 'tube', 'pack', 'bag', 'can'],
  subUnits: ['ml', 'tablet', 'capsule', 'kg', 'g', 'mg', 'pcs', 'dose'],
  brands: ['Apollo', 'Beaphar', 'Royal Canin', 'Purina', 'Iams', 'Pedigree', 'Generic'],
  expenseCategories: ['Supplies', 'Medicine Inventory', 'Store Inventory', 'Purchase Orders', 'Utilities', 'Rent', 'Salaries', 'Equipment', 'Maintenance', 'Transportation', 'Marketing', 'Bank Deposit', 'Other'],
  paymentMethods: ['Cash', 'GCash', 'Bank Transfer', 'Check', 'Credit Card'],
  medicineForms: { tablet: 'Tablet / Capsule', syrup: 'Syrup / Liquid', vial: 'Vial / Injectable', other: 'Other' },
  lowStockThreshold: 10,
  clinicName: 'Happi Dogs',
  clinicAddress: 'Pob. Ilaya, Lambunao, Iloilo',
  clinicPhone: '0915 325 2959',
  attendingVeterinarian: '',
}

export const getMasterData = async () => {
  try {
    const docRef = doc(db, 'settings', 'masterData')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) return docSnap.data()
    return null
  } catch (error) {
    console.error('Error getting master data:', error)
    return null
  }
}

export const saveMasterData = async (data) => {
  try {
    const docRef = doc(db, 'settings', 'masterData')
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
  } catch (error) {
    console.error('Error saving master data:', error)
    throw error
  }
}
