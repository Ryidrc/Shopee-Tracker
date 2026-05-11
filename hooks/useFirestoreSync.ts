import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreSync<T>(
  collectionName: string,
  docId: string,
  defaultValue: T,
  sanitizer?: (val: unknown) => T
): [T, (value: T | ((prevState: T) => T)) => void, boolean] {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, collectionName, docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data().value;
        setData(sanitizer ? sanitizer(rawData) : rawData as T);
      } else {
        setDoc(docRef, { value: defaultValue });
        setData(defaultValue);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to Firestore:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, docId]);

  const updateData = async (value: T | ((prevState: T) => T)) => {
    setData((prev) => {
      const newValue = typeof value === 'function' 
        ? (value as (prevState: T) => T)(prev) 
        : value;
      
      const docRef = doc(db, collectionName, docId);
      setDoc(docRef, { value: newValue }).catch(error => {
         console.error("Error updating Firestore:", error);
      });
      
      return newValue;
    });
  };

  return [data, updateData, isLoading];
}
