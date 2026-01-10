// src/pages/PetCardPage.tsx
import { useParams } from "react-router-dom";
import { useRef } from "react";
import toast from "react-hot-toast";

const PetCardPage = () => {
    const { petId } = useParams();

    if (!petId) return <div className="flex justify-center items-center min-h-screen">Pet information not found</div>;

    const cardUrl = `http://localhost:5000/api/v1/pet/pet-card/${petId}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(cardUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pet-card-${petId}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Unable to download the card. Please try again!');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative flex flex-col items-center">
                <img src={cardUrl} alt="Pet Card" className="w-full h-auto rounded-lg" />
                <button
                    onClick={handleDownload}
                    className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                >
                    Download Card
                </button>
            </div>
        </div>
    );
};

export default PetCardPage;
