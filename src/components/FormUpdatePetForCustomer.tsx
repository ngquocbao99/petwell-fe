import * as React from "react";
import { useState, ChangeEvent, FormEvent } from "react";
import { UploadCloud } from "lucide-react";
import Axios from "../utils/Axios";
import ServiceAPI from "../common/SummarryAPI";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

interface Pet {
  _id: string;
  petName: string;
  species: string;
  breed: string;
  age: string | number;
  medicalHistory: string;
  imageUrl?: string;
}

interface PetForm {
  petName: string;
  species: string;
  breed: string;
  age: string;
  medicalHistory: string;
  imageUrl: string;
}

interface FormUpdatePetForCustomerProps {
  pet: Pet;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  petName?: string;
  species?: string;
  breed?: string;
  age?: string;
  imageFile?: string;
}

const FormUpdatePetForCustomer: React.FC<FormUpdatePetForCustomerProps> = ({
  pet,
  onSuccess,
  onCancel,
}) => {
  const { userId } = useSelector((state: RootState) => state.user);
  const [editForm, setEditForm] = useState<PetForm>({
    petName: pet.petName,
    species: pet.species,
    breed: pet.breed,
    age: pet.age ? String(pet.age) : "",
    medicalHistory: pet.medicalHistory,
    imageUrl: pet.imageUrl || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!editForm.petName.trim()) newErrors.petName = "Please enter pet name";
    if (!editForm.species.trim()) newErrors.species = "Please enter species";
    if (!editForm.breed.trim()) newErrors.breed = "Please enter breed";
    if (editForm.age === "" || editForm.age === undefined) {
      newErrors.age = "Please enter age";
    } else if (isNaN(Number(editForm.age)) || Number(editForm.age) < 0) {
      newErrors.age = "Invalid age";
    }
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      newErrors.imageFile = "Please upload an image file";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        setErrors((prev) => ({
          ...prev,
          imageFile: "Please upload an image file",
        }));
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, imageFile: undefined }));
    }
  };

  const handleUpdatePet = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const petDetails = {
        petName: editForm.petName,
        species: editForm.species,
        breed: editForm.breed,
        age: parseInt(editForm.age.toString()),
        medicalHistory: editForm.medicalHistory,
        userId,
      };

      let dataToSend: any = petDetails;

      if (selectedFile) {
        const formData = new FormData();
        Object.entries(petDetails).forEach(([key, value]) => {
          formData.append(`petDetails[${key}]`, value.toString());
        });
        const fileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const file = new File([selectedFile], fileName, {
          type: selectedFile.type,
        });
        formData.append("image", file);
        dataToSend = formData;
      }

      const res = await Axios({
        ...ServiceAPI.pets.updatePetCustomer(pet._id),
        data: dataToSend,
        headers: selectedFile
          ? {
              "Content-Type": "multipart/form-data",
            }
          : undefined,
      });

      if (res.data.success) {
        toast.success("Pet updated successfully!");
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        onSuccess();
      } else {
        toast.error(res.data.message || "Failed to update pet");
      }
    } catch (err) {
      AxiosToastError(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 rounded-t-xl">
        <h2 className="text-xl font-bold text-white text-center">
          Update Pet Information
        </h2>
        <p className="text-yellow-100 text-center text-sm mt-1">
          Please update your pet's information
        </p>
      </div>

      <div className="p-4">
        <form onSubmit={handleUpdatePet} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="petName"
                className="block text-sm font-medium text-gray-700"
              >
                Pet Name <span className="text-red-500">*</span>
              </label>
              <input
                id="petName"
                type="text"
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                  errors.petName
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                value={editForm.petName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    petName: e.target.value,
                  }))
                }
                autoComplete="off"
              />
              {errors.petName && (
                <p className="text-red-500 text-xs mt-1">{errors.petName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="species"
                className="block text-sm font-medium text-gray-700"
              >
                Species <span className="text-red-500">*</span>
              </label>
              <input
                id="species"
                type="text"
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                  errors.species
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                value={editForm.species}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    species: e.target.value,
                  }))
                }
                autoComplete="off"
              />
              {errors.species && (
                <p className="text-red-500 text-xs mt-1">{errors.species}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="breed"
                className="block text-sm font-medium text-gray-700"
              >
                Breed <span className="text-red-500">*</span>
              </label>
              <input
                id="breed"
                type="text"
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                  errors.breed ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                value={editForm.breed}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    breed: e.target.value,
                  }))
                }
                autoComplete="off"
              />
              {errors.breed && (
                <p className="text-red-500 text-xs mt-1">{errors.breed}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700"
              >
                Age <span className="text-red-500">*</span>
              </label>
              <input
                id="age"
                type="text"
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                  errors.age ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                value={editForm.age}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    age: e.target.value,
                  }))
                }
                autoComplete="off"
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="medicalHistory"
              className="block text-sm font-medium text-gray-700"
            >
              Medical History
            </label>
            <textarea
              id="medicalHistory"
              rows={2}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors resize-none"
              value={editForm.medicalHistory}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  medicalHistory: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Pet Image
            </label>
            <div className="mt-1 flex justify-center px-4 pt-3 pb-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 transition-colors">
              <div className="space-y-1 text-center">
                {previewUrl || editForm.imageUrl ? (
                  <div className="mb-2">
                    <img
                      src={previewUrl || editForm.imageUrl}
                      alt="Preview"
                      className="mx-auto h-24 w-auto object-cover rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                )}
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="fileInput"
                    className="relative cursor-pointer bg-yellow-50 rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-400 px-3 py-1.5"
                  >
                    <span>Choose Image</span>
                    <input
                      id="fileInput"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1 pt-1.5 text-xs">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
            {errors.imageFile && (
              <p className="text-red-500 text-xs mt-1">{errors.imageFile}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                onCancel();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormUpdatePetForCustomer;
