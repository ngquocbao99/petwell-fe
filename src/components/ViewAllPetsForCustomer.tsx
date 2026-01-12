import * as React from "react";
import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Plus } from "lucide-react";
import Axios from "../utils/Axios";
import ServiceAPI from "../common/SummarryAPI";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import FormCreatePetForCustomer from "./FormCreatePetForCustomer";
import FormUpdatePetForCustomer from "./FormUpdatePetForCustomer";
import PetCardModal from "./PetCardModal";

interface Pet {
  _id: string;
  petName: string;
  species: string;
  breed: string;
  age: string | number;
  medicalHistory: string;
  imageUrl?: string;
}

const ViewAllPetsForCustomer: React.FC = () => {
  const { userId } = useSelector((state: RootState) => state.user);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [editPetId, setEditPetId] = useState<string | null>(null);
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const fetchAllPets = async () => {
    try {
      const res = await Axios({
        url: `/api/v1/pets/view-all-pet-customer?userId=${userId}`,
        method: "get",
      });
      if (res.data.success) {
        setPets(res.data.data);
      } else {
        setError(res.data.message || "Failed to fetch pets");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching pets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAllPets();
    }
  }, [userId]);

  const handleEdit = (id: string) => {
    setEditPetId(id);
  };

  const confirmDeletePet = async () => {
    if (!confirmDelete) return;
    try {
      const res = await Axios({
        ...ServiceAPI.pets.deletePetCustomer(confirmDelete),
        data: { userId },
      });
      if (res.data?.success) {
        setPets((prev) => prev.filter((pet) => pet._id !== confirmDelete));
        toast.success("Pet deleted successfully!");
      } else {
        toast.error(res.data.message || "Failed to delete pet");
      }
    } catch (err) {
      AxiosToastError(err);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="relative max-w-7xl mx-auto p-6 bg-white rounded-lg shadow border border-yellow-400">
      {/* Add Pet Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">My Pet Profiles</h2>
        <button
          onClick={() => setShowAddPetForm(true)}
          className="flex items-center gap-2 px-5 py-2 bg-[#FF7A00] hover:bg-[#ff9900] text-white font-semibold rounded-lg shadow transition-colors text-base"
        >
          <span className="text-xl">+</span> Add Pet
        </button>
      </div>

      {/* Add Pet Form Modal */}
      {showAddPetForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="p-4">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowAddPetForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <FormCreatePetForCustomer
                onSuccess={() => {
                  setShowAddPetForm(false);
                  if (userId) {
                    fetchAllPets();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success modal */}
      {successModal && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="bg-white border border-green-300 shadow-md p-6 rounded-lg text-center animate-bounce">
            <CheckCircle className="text-green-500 w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-800">Success</h3>
            <p className="text-sm text-gray-500">{successMessage}</p>
          </div>
        </div>
      )}

      {/* ✅ Edit Pet Modal */}
      {editPetId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <FormUpdatePetForCustomer
            pet={pets.find((p) => p._id === editPetId)!}
            onSuccess={() => {
              setEditPetId(null);
              fetchAllPets();
            }}
            onCancel={() => setEditPetId(null)}
          />
        </div>
      )}

      {/* ✅ Confirmation Modal */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <AlertTriangle className="text-yellow-500 w-10 h-10 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Are you sure?
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This action will delete the pet profile.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={confirmDeletePet}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && (
        <div className="text-red-600 text-center font-medium mb-4">{error}</div>
      )}

      {!loading && !error && pets.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data</h3>
        </div>
      )}

      {pets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-xl shadow border border-gray-200">
            <thead className="bg-[#FFF5EB]">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Image
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Species
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Breed
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Age
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Medical History
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Actions
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700">
                  Pet Card
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pets.map((pet) => (
                <tr
                  key={pet._id}
                  className="hover:bg-[#FFF5EB] transition-colors"
                >
                  <td className="px-6 py-4">
                    {pet.imageUrl ? (
                      <img
                        src={pet.imageUrl}
                        alt={pet.petName}
                        className="w-12 h-12 object-cover rounded-full border-2 border-[#FFD6A0] bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-[#FFD6A0] bg-[#FAFAFA] flex items-center justify-center">
                        <span className="text-gray-300 text-2xl">●</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {pet.petName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{pet.species}</td>
                  <td className="px-6 py-4 text-gray-700">{pet.breed}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 text-xs font-semibold border border-[#FF7A00] text-[#FF7A00] bg-white rounded-full">
                      {pet.age}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {pet.medicalHistory || "-"}
                  </td>
                  <td className="px-6 py-4 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(pet._id)}
                      className="p-2 rounded border border-[#FFD6A0] bg-white hover:bg-[#FFF5EB] text-[#FF7A00] transition-colors"
                      title="Edit"
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(pet._id)}
                      className="p-2 rounded border border-[#FFD6A0] bg-white hover:bg-[#FFF5EB] text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      onClick={() => setSelectedPetId(pet._id)}
                    >
                      View Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pet Card Modal */}
      {selectedPetId && (
        <PetCardModal petId={selectedPetId} onClose={() => setSelectedPetId(null)} />
      )}
    </div>
  );
};

export default ViewAllPetsForCustomer;
