/**
 * Prescription interface for the frontend
 * 
 * Note on ID fields:
 * In the MongoDB database (backend), these fields are ObjectId types.
 * However, when sent through the API as JSON, ObjectIds are automatically
 * serialized to strings. That's why in the frontend, we define them as strings,
 * not as MongoDB ObjectId types.
 */
export interface Prescription {
  _id: string;               // MongoDB ObjectId serialized as string
  appointmentId: string;     // MongoDB ObjectId serialized as string
  doctorId: string;          // MongoDB ObjectId serialized as string 
  doctorName: string;        // Populated from User model
  petName: string;           // Populated from Pet model
  petSpecies: string;        // Populated from Pet model
  petBreed: string;          // Populated from Pet model
  age: number;               // Pet age
  medications: string | Medication[];  // Can be string or array of medications
  instructions: string;
  medicalHistory?: string;
  imageUrl?: string;
  isDeleted: boolean;
  createdAt: string;         // ISO date string
  updatedAt: string;         // ISO date string
}

export interface Medication {
  name: string;
  dosage: string;
  duration: string;
}

export interface DiagnosisResult {
  diagnosis: string;
  healthCondition: string;
  treatment: string;
  medications: Medication[];
  instructions: string;
}

// Add a default export as well to ensure it can be imported either way
export default Prescription;
