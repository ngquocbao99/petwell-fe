import React, { useState } from "react";
import { X, Plus, Minus, Calendar, User, FileText } from "lucide-react";

interface DiagnosisFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onSubmit: (diagnosisData: any) => void;
  submitting: boolean;
}

const DiagnosisFormModal: React.FC<DiagnosisFormModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSubmit,
  submitting,
}) => {
  const [diagnosisData, setDiagnosisData] = useState({
    healthCondition: "",
    diagnosis: "",
    treatment: "",
    testResults: [] as string[],
    treatmentRecommendations: "",
    reExaminationDate: "",
    medications: [
      {
        name: "",
        dosage: "",
        duration: "",
        note: "",
      },
    ],
    instructions: "",
    pdfUrl: "",
  });

  const [diagnosisFormErrors, setDiagnosisFormErrors] = useState({
    healthCondition: false,
    diagnosis: false,
    treatment: false,
    medications: [] as Array<{
      name: boolean;
      dosage: boolean;
      duration: boolean;
    }>,
    reExaminationDate: false,
  });

  const [testResultInput, setTestResultInput] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setDiagnosisData({
        healthCondition: "",
        diagnosis: "",
        treatment: "",
        testResults: [],
        treatmentRecommendations: "",
        reExaminationDate: "",
        medications: [
          {
            name: "",
            dosage: "",
            duration: "",
            note: "",
          },
        ],
        instructions: "",
        pdfUrl: "",
      });
      setDiagnosisFormErrors({
        healthCondition: false,
        diagnosis: false,
        treatment: false,
        medications: [
          {
            name: false,
            dosage: false,
            duration: false,
          },
        ],
        reExaminationDate: false,
      });
      setTestResultInput("");
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDiagnosisData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (
      name === "healthCondition" ||
      name === "diagnosis" ||
      name === "treatment" ||
      name === "reExaminationDate"
    ) {
      setDiagnosisFormErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  const handleMedicationChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedMedications = [...diagnosisData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    };

    setDiagnosisData((prev) => ({
      ...prev,
      medications: updatedMedications,
    }));

    // Clear validation error for this field
    if (field === "name" || field === "dosage" || field === "duration") {
      const updatedErrors = [...diagnosisFormErrors.medications];
      updatedErrors[index] = {
        ...updatedErrors[index],
        [field]: false,
      };

      setDiagnosisFormErrors((prev) => ({
        ...prev,
        medications: updatedErrors,
      }));
    }
  };

  const addMedication = () => {
    setDiagnosisData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "", duration: "", note: "" },
      ],
    }));

    setDiagnosisFormErrors((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: false, dosage: false, duration: false },
      ],
    }));
  };

  const removeMedication = (index: number) => {
    const updatedMedications = [...diagnosisData.medications];
    updatedMedications.splice(index, 1);
    setDiagnosisData((prev) => ({
      ...prev,
      medications: updatedMedications,
    }));

    const updatedErrors = [...diagnosisFormErrors.medications];
    updatedErrors.splice(index, 1);
    setDiagnosisFormErrors((prev) => ({
      ...prev,
      medications: updatedErrors,
    }));
  };

  const handleAddTestResult = () => {
    if (testResultInput.trim()) {
      setDiagnosisData((prev) => ({
        ...prev,
        testResults: [...prev.testResults, testResultInput.trim()],
      }));
      setTestResultInput("");
    }
  };

  const removeTestResult = (index: number) => {
    const updatedResults = [...diagnosisData.testResults];
    updatedResults.splice(index, 1);
    setDiagnosisData((prev) => ({
      ...prev,
      testResults: updatedResults,
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const medicationErrors = diagnosisData.medications.map((med) => ({
      name: !med.name.trim(),
      dosage: !med.dosage.trim(),
      duration: !med.duration.trim(),
    }));

    const reExaminationDateError = diagnosisData.reExaminationDate
      ? new Date(diagnosisData.reExaminationDate) < new Date()
      : false;

    const errors = {
      healthCondition: !diagnosisData.healthCondition.trim(),
      diagnosis: !diagnosisData.diagnosis.trim(),
      treatment: !diagnosisData.treatment.trim(),
      medications: medicationErrors,
      reExaminationDate: reExaminationDateError,
    };

    setDiagnosisFormErrors(errors);

    const hasMedicationErrors = medicationErrors.some(
      (med) => med.name || med.dosage || med.duration
    );
    const hasValidationErrors =
      errors.healthCondition ||
      errors.diagnosis ||
      errors.treatment ||
      hasMedicationErrors ||
      (diagnosisData.reExaminationDate && reExaminationDateError);

    if (hasValidationErrors) {
      return;
    }

    onSubmit(diagnosisData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-[#e67e22] text-white">
          <h2 className="text-xl font-semibold">Submit Diagnosis Result</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-full hover:bg-[#d35400] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Appointment Info */}
          <div className="bg-[#f8f8f8] p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-[#663300] mb-2 flex items-center">
              <User size={18} className="mr-2 text-[#e67e22]" />
              Appointment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium text-[#663300]">
                  {appointment.customerId?.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pet</p>
                <p className="font-medium text-[#663300]">
                  {appointment.petId?.breed} (Age: {appointment.petId?.age})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Symptoms</p>
                <p className="font-medium text-[#663300]">
                  {appointment.symptoms}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Appointment Date</p>
                <p className="font-medium text-[#663300]">
                  {new Date(appointment.appointment_date).toLocaleString(
                    "vi-VN"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis Form */}
          <div className="space-y-4">
            {/* Health Condition */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Health Condition <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="healthCondition"
                value={diagnosisData.healthCondition}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                  diagnosisFormErrors.healthCondition
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter health condition"
                disabled={submitting}
              />
              {diagnosisFormErrors.healthCondition && (
                <p className="text-red-500 text-sm mt-1">
                  Health condition is required
                </p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                name="diagnosis"
                value={diagnosisData.diagnosis}
                onChange={handleInputChange}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                  diagnosisFormErrors.diagnosis
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter diagnosis"
                disabled={submitting}
              />
              {diagnosisFormErrors.diagnosis && (
                <p className="text-red-500 text-sm mt-1">
                  Diagnosis is required
                </p>
              )}
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Treatment <span className="text-red-500">*</span>
              </label>
              <textarea
                name="treatment"
                value={diagnosisData.treatment}
                onChange={handleInputChange}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                  diagnosisFormErrors.treatment
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter treatment plan"
                disabled={submitting}
              />
              {diagnosisFormErrors.treatment && (
                <p className="text-red-500 text-sm mt-1">
                  Treatment is required
                </p>
              )}
            </div>

            {/* Test Results */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Test Results
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={testResultInput}
                  onChange={(e) => setTestResultInput(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22]"
                  placeholder="Enter test result"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={handleAddTestResult}
                  className="px-4 py-2 bg-[#e67e22] text-white rounded-lg hover:bg-[#d35400] disabled:opacity-50"
                  disabled={submitting}
                >
                  Add
                </button>
              </div>
              {diagnosisData.testResults.length > 0 && (
                <div className="space-y-2">
                  {diagnosisData.testResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <span className="flex-1 text-sm">{result}</span>
                      <button
                        type="button"
                        onClick={() => removeTestResult(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={submitting}
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Medications <span className="text-red-500">*</span>
              </label>
              {diagnosisData.medications.map((medication, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 mb-3"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-[#663300]">
                      Medication {index + 1}
                    </span>
                    {diagnosisData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={submitting}
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.name}
                        onChange={(e) =>
                          handleMedicationChange(index, "name", e.target.value)
                        }
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                          diagnosisFormErrors.medications[index]?.name
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Medication name"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) =>
                          handleMedicationChange(
                            index,
                            "dosage",
                            e.target.value
                          )
                        }
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                          diagnosisFormErrors.medications[index]?.dosage
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Dosage"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) =>
                          handleMedicationChange(
                            index,
                            "duration",
                            e.target.value
                          )
                        }
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                          diagnosisFormErrors.medications[index]?.duration
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Duration"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <input
                      type="text"
                      value={medication.note}
                      onChange={(e) =>
                        handleMedicationChange(index, "note", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22]"
                      placeholder="Additional notes"
                      disabled={submitting}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addMedication}
                className="flex items-center gap-2 px-4 py-2 border border-[#e67e22] text-[#e67e22] rounded-lg hover:bg-[#e67e22] hover:text-white transition-colors"
                disabled={submitting}
              >
                <Plus size={16} />
                Add Medication
              </button>
            </div>

            {/* Re-examination Date */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Re-examination Date
              </label>
              <input
                type="datetime-local"
                name="reExaminationDate"
                value={diagnosisData.reExaminationDate}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22] ${
                  diagnosisFormErrors.reExaminationDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={submitting}
              />
              {diagnosisFormErrors.reExaminationDate && (
                <p className="text-red-500 text-sm mt-1">
                  Re-examination date cannot be in the past
                </p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-[#663300] mb-2">
                Instructions
              </label>
              <textarea
                name="instructions"
                value={diagnosisData.instructions}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e67e22] focus:border-[#e67e22]"
                placeholder="Additional instructions for the customer"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[#e67e22] text-white rounded-md hover:bg-[#d35400] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Diagnosis"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisFormModal;
