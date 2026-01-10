import React from "react";

interface PetCardModalProps {
    petId: string | null;
    onClose: () => void;
}

const PetCardModal: React.FC<PetCardModalProps> = ({ petId, onClose }) => {
    if (!petId) return null;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=http://localhost:5173/pet-card/${petId}&size=200x200`;

    const handleDownload = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pet-qr-${petId}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Unable to download the QR code. Please try again!');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-xs w-full relative flex flex-col items-center">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="mb-4 text-lg font-semibold text-center">Pet QR Code</div>
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                >
                    Download QR Code
                </button>
                <div className="mt-2 text-sm text-gray-500 text-center">Scan the QR code to view pet card information</div>
            </div>
        </div>
    );
};

export default PetCardModal; 