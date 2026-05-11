import { useState, useEffect, useRef, useCallback } from 'react';
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
  // Keep a ref to the current value so we can resolve functional updates
  // without putting side effects inside the setState updater
  const dataRef = useRef<T>(defaultValue);

  useEffect(() => {
    const docRef = doc(db, collectionName, docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data().value;
        const value = sanitizer ? sanitizer(rawData) : rawData as T;
        dataRef.current = value;
        setData(value);
      } else {
        setDoc(docRef, { value: defaultValue });
        dataRef.current = defaultValue;
        setData(defaultValue);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to Firestore:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, docId]);

  const updateData = useCallback((value: T | ((prevState: T) => T)) => {
    // Resolve the new value OUTSIDE of setState to avoid side effects inside updater
    const newValue = typeof value === 'function'
      ? (value as (prevState: T) => T)(dataRef.current)
      : value;

    // Update local state
    dataRef.current = newValue;
    setData(newValue);

    // Persist to Firestore separately
    const docRef = doc(db, collectionName, docId);
    setDoc(docRef, { value: newValue }).catch(error => {
      console.error("Error updating Firestore:", error);
    });
  }, [collectionName, docId]);

  return [data, updateData, isLoading];
}
