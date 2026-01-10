export interface DiagnosisRecord {
  _id: string;
  appointmentId: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  symptoms: string;
  // From diagnosisResult
  healthCondition: string;
  diagnosis: string;
  treatment: string;
  testResults: string[] | string;
  treatmentRecommendations: string;
  reExaminationDate?: string;
  diagnosedAt?: string;
  medications: {
    name: string;
    dosage: string;
    duration: string;
    note?: string;
  }[];
  instructions: string;
  pdfUrl?: string;
  // Meta
  status: 'completed' | 'in-progress' | 'scheduled';
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  _id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  ownerId: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
