import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  getDocs
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmHP7pmyySEOoO9ZlmoCAdKW3iDVGjC1c",
  authDomain: "ubumuntu-8d53c.firebaseapp.com",
  projectId: "ubumuntu-8d53c",
  storageBucket: "ubumuntu-8d53c.firebasestorage.app",
  messagingSenderId: "894659655360",
  appId: "1:894659655360:web:d289cbf449f789f89e9f25",
  measurementId: "G-MJGP10SWBX"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Collection reference for RAG queries
const queriesCollection = collection(db, "rag_queries");
// Collection reference for RAG responses
const responsesCollection = collection(db, "rag_responses");

/**
 * Save a RAG query to Firebase Firestore
 * @param query The text query sent to the RAG API
 * @param response The response received from the RAG API (or error)
 * @param metadata Additional metadata about the query
 * @returns Promise with the document reference
 */
export async function saveQueryToFirebase(
  query: string, 
  response: any,
  metadata: {
    category?: string | null;
    source?: string;
    userAgent?: string;
    success: boolean;
    dashboardContext?: {
      cols: number;
      rows: number;
      rowHeight: number;
      margin: [number, number];
      activeCategory: string | null;
      numApps: number;
    } | null;
  }
) {
  try {
    // Add a new document with a generated ID
    const docRef = await addDoc(queriesCollection, {
      query,
      response,
      timestamp: serverTimestamp(),
      ...metadata
    });
    
    console.log("Query saved to Firebase with ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error saving query to Firebase:", error);
    throw error;
  }
}

/**
 * Get the most recent RAG queries from Firebase
 * @param count Number of queries to retrieve
 * @returns Promise with the query results
 */
export async function getRecentQueries(count: number = 10) {
  try {
    console.log(`Fetching up to ${count} recent queries from Firebase collection: ${queriesCollection.path}`);
    
    // Create a query against the collection
    const q = query(
      queriesCollection,
      orderBy("timestamp", "desc"),
      limit(count)
    );
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    console.log(`Firebase returned ${querySnapshot.docs.length} documents from ${queriesCollection.path}`);
    
    // Map the results to a more usable format
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure response exists
        response: data.response || { 
          answer: "No response data",
          success: false
        }
      };
    });
    
    return results;
  } catch (error) {
    console.error("Error retrieving recent queries from Firebase:", error);
    throw error;
  }
}

/**
 * Get the most recent RAG responses from Firebase
 * @param count Number of responses to retrieve
 * @returns Promise with the response results
 */
export async function getRecentResponses(count: number = 10) {
  try {
    console.log(`Fetching up to ${count} recent responses from Firebase collection: ${responsesCollection.path}`);
    
    // Create a query against the responses collection
    const q = query(
      responsesCollection,
      orderBy("timestamp", "desc"),
      limit(count)
    );
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    console.log(`Firebase returned ${querySnapshot.docs.length} documents from ${responsesCollection.path}`);
    
    // Map the results to a more usable format
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure response exists
        response: data.response || { 
          answer: "No response data",
          success: false
        }
      };
    });
    
    return results;
  } catch (error) {
    console.error("Error retrieving recent responses from Firebase:", error);
    throw error;
  }
}

export { db }; 