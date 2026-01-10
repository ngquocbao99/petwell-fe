import { useState, ChangeEvent, FormEvent } from "react";
import { UploadCloud, Plus } from "lucide-react";
import Axios from "../utils/Axios";
import ServiceAPI from "../common/SummarryAPI";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const BREEDS = {
  Cat: [
    "Black Cat",
    "Mướp Cat",
    "British Shorthair",
    "British Longhair",
    "Persian",
    "Siamese (Modern)",
    "Maine Coon",
    "Ragdoll",
    "Scottish Fold",
    "Sphynx",
    "Bengal",
    "Munchkin",
    "American Shorthair",
    "Russian Blue",
    "Exotic Shorthair",
    "Turkish Angora",
    "Burmese",
    "Somali",
    "Chartreux",
    "Oriental Shorthair",
    "Abyssinian",
    "Devon Rex",
  ],
  Dog: [
    "Chó Phú Quốc",
    "Poodle",
    "Pomeranian",
    "Chihuahua",
    "Shih Tzu",
    "Corgi",
    "Pekingese (Bắc Kinh)",
    "Golden Retriever",
    "Labrador Retriever",
    "Husky",
    "Alaska Malamute",
    "Doberman",
    "Rottweiler",
    "Samoyed",
    "Pug",
    "French Bulldog",
    "German Shepherd",
    "Beagle",
    "Maltese",
    "Shiba Inu",
    "Border Collie",
  ],
};

interface PetFormData {
  petName: string;
  species: string;
  breed: string;
  age: string | number;
  medicalHistory: string;
  imageFile: File | null;
  imagePreview: string | null;
  customerId: string;
  createBy: string;
}

interface FormErrors {
  petName?: string;
  species?: string;
  breed?: string;
  age?: string;
}

interface SubmitMessage {
  text: string;
  isError: boolean;
}

interface FormCreatePetForCustomerProps {
  onSuccess?: () => void;
}

const FormCreatePetForCustomer: React.FC<FormCreatePetForCustomerProps> = ({
  onSuccess,
}) => {
  const { userId } = useSelector((state: RootState) => state.user);
  const [formData, setFormData] = useState<PetFormData>({
    petName: "",
    species: "",
    breed: "",
    age: "",
    medicalHistory: "",
    imageFile: null,
    imagePreview: null,
    customerId: "",
    createBy: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage>({
    text: "",
    isError: false,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.petName.trim()) {
      newErrors.petName = "Please enter pet name";
    }
    if (!formData.species) {
      newErrors.species = "Please select species";
    }
    if (!formData.breed) {
      newErrors.breed = "Please select breed";
    }
    if (!formData.age) {
      newErrors.age = "Please enter age";
    } else if (Number(formData.age) < 0) {
      newErrors.age = "Invalid age";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "species") {
      setFormData({
        ...formData,
        [name]: value,
        breed: "", // Reset breed when species changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === "age" ? (value === "" ? "" : parseInt(value)) : value,
      });
    }
    // Clear error when user starts typing/selecting
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!userId) {
      toast.error("User ID not found. Please login again.");
      return;
    }
    setIsSubmitting(true);

    try {
      const petFormData = new FormData();

      const petDetails = {
        petName: formData.petName,
        species: formData.species,
        breed: formData.breed,
        age: parseInt(formData.age.toString()),
        medicalHistory: formData.medicalHistory,
        customerId: userId,
        createBy: userId,
      };

      petFormData.append("user_id", userId);

      Object.entries(petDetails).forEach(([key, value]) => {
        petFormData.append(`petDetails[${key}]`, value.toString());
      });

      if (formData.imageFile) {
        const fileName = formData.imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const file = new File([formData.imageFile], fileName, {
          type: formData.imageFile.type,
        });
        petFormData.append("image", file);
      }
      const response = await Axios({
        ...ServiceAPI.pets.createPetCustomer,
        data: petFormData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Pet created successfully!");
        setFormData({
          petName: "",
          species: "",
          breed: "",
          age: "",
          medicalHistory: "",
          imageFile: null,
          imagePreview: null,
          customerId: "",
          createBy: "",
        });
        onSuccess?.();
      } else {
        toast.error(response.data.message || "Failed to create pet");
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-yellow-400 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4">
          <h2 className="text-xl font-bold text-white text-center">
            Add New Pet
          </h2>
          <p className="text-yellow-100 text-center text-sm mt-1">
            Please fill in your pet's information
          </p>
        </div>

        {/* Form Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pet Name and Species */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="petName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="petName"
                  name="petName"
                  value={formData.petName}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                    errors.petName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter pet's name"
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
                <select
                  id="species"
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                    errors.species
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select Species</option>
                  <option value="Cat">Cat</option>
                  <option value="Dog">Dog</option>
                </select>
                {errors.species && (
                  <p className="text-red-500 text-xs mt-1">{errors.species}</p>
                )}
              </div>
            </div>

            {/* Breed and Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="breed"
                  className="block text-sm font-medium text-gray-700"
                >
                  Breed <span className="text-red-500">*</span>
                </label>
                <select
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                    errors.breed
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  disabled={!formData.species}
                >
                  <option value="">Select Breed</option>
                  {formData.species &&
                    BREEDS[formData.species as keyof typeof BREEDS]?.map(
                      (breed) => (
                        <option key={breed} value={breed}>
                          {breed}
                        </option>
                      )
                    )}
                </select>
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
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors ${
                    errors.age ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Enter age"
                />
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                )}
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-1">
              <label
                htmlFor="medicalHistory"
                className="block text-sm font-medium text-gray-700"
              >
                Medical History
              </label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors resize-none"
                placeholder="Enter your pet's medical history (if any)"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Pet Image
              </label>
              <div className="mt-1 flex justify-center px-4 pt-3 pb-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 transition-colors">
                <div className="space-y-1 text-center">
                  {formData.imagePreview ? (
                    <div className="mb-2">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="mx-auto h-24 w-auto object-cover rounded-lg shadow-md"
                      />
                    </div>
                  ) : (
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="image-upload"
                      className="relative cursor-pointer bg-yellow-50 rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-400 px-3 py-1.5"
                    >
                      <span>Choose Image</span>
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1 pt-1.5 text-xs">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center px-4 py-1.5 border border-transparent rounded-lg shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-colors ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <Plus className="w-5 h-5 mr-2" />
                {isSubmitting ? "Creating..." : "Add Pet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormCreatePetForCustomer;
