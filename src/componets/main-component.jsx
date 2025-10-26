import React, { useState, useEffect, useRef } from "react";

// --- Reusable Modal Component ---
// This component is used for all pop-ups.
const Modal = ({ title, children, buttonText, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 mx-auto bg-yellow-50 rounded-lg shadow-2xl ring-2 ring-yellow-700/50">
        <h2 className="mb-4 text-2xl font-bold text-center text-gray-900 font-serif">
          {title}
        </h2>
        <div className="space-y-4 text-gray-800">{children}</div>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 mt-6 font-bold text-gray-900 uppercase transition-all transform rounded-lg shadow-lg bg-yellow-600 hover:bg-yellow-500 hover:scale-105"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

// --- Main Application Component ---
// Note: Removed "export default" for local browser running
export default function MainComponent() {
  // 'step' controls the current stage of the quest
  const [step, setStep] = useState("greeting"); // greeting, downloading, error, scanning, found

  // State for the download progress bar
  const [progress, setProgress] = useState(0);

  // State for the modal (error/instructions)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    text: "",
    button: "",
    onClose: null,
  });

  // Refs for camera video feed and stream object
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // States for simple fade-in animations
  const [titleVisible, setTitleVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  // --- MODAL CLOSE HANDLERS ---

  // This is the handler for the *first* "Download Error"
  const handleDownloadErrorClose = () => {
    setIsModalOpen(false);
    // Automatically proceed to the instructions
    setStep("instructions"); // Use a nominal step for the modal
    setModalContent({
      title: "The Magical Upgrade Procedure",
      text: 'You must scan your surroundings to check for obstacles to the upgrade. Point your camera and press the "Scan" button.',
      button: "I Understand",
      onClose: handleInstructionsModalClose, // Point to the next handler
    });
    setIsModalOpen(true);
  };

  // This is the handler for the "Instructions" modal
  const handleInstructionsModalClose = () => {
    setIsModalOpen(false);
    setStep("scanning"); // Now we start the camera
  };

  // This handler restarts the whole quest
  const handleRestart = () => {
    // Reset all states to default
    setStep("greeting");
    setProgress(0);
    setIsModalOpen(false);
    setTitleVisible(false);
    setTextVisible(false);
    setButtonVisible(false);
    // Ensure camera stream is stopped if it was running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // --- EFFECTS ---

  // Effect for the "Greeting" screen fade-in animation
  useEffect(() => {
    if (step === "greeting") {
      const t1 = setTimeout(() => setTitleVisible(true), 300);
      const t2 = setTimeout(() => setTextVisible(true), 1000);
      const t3 = setTimeout(() => setButtonVisible(true), 1700);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  // Effect for the "Downloading" progress bar simulation
  useEffect(() => {
    if (step === "downloading") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) {
            clearInterval(interval);
            setStep("error"); // Set to error step
            setModalContent({
              title: "Download Error",
              text: "Insufficient magical energy for upgrade. Failed to initiate system upgrade. A device with the newest enchanting technologies is required.",
              button: "Acknowledged",
              onClose: handleDownloadErrorClose, // Use the new handler
            });
            setIsModalOpen(true);
            return 88;
          }
          return prev + 2; // Increase progress
        });
      }, 100); // ~5-6 seconds total

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Effect to start and stop the camera stream
  useEffect(() => {
    async function startCamera() {
      if (step === "scanning" && !streamRef.current) {
        try {
          // Request back camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
        } catch (err) {
          console.error("Error accessing camera:", err);
          // *** THIS IS THE FIX ***
          // Do NOT change the step. Just show a modal on top.
          setModalContent({
            title: "Camera Error",
            text: "Failed to access camera. Please ensure permissions are granted and try again.",
            button: "Restart",
            onClose: handleRestart, // Use the RESTART handler
          });
          setIsModalOpen(true);
        }
      }
    }

    if (step === "scanning") {
      startCamera();
    }

    // Cleanup function to stop the camera when component unmounts or step changes
    return () => {
      if (streamRef.current) {
        console.log("Cleaning up camera stream...");
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [step]); // This effect depends on 'step'

  // --- EVENT HANDLERS ---

  const handleDownloadClick = () => {
    setStep("downloading");
  };

  // --- RENDER ---

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 text-yellow-50 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 font-sans overflow-hidden">
      {/* Background magical particles (subtle) */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#eab308 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-black opacity-20"></div>

      {/* Modal display logic */}
      {isModalOpen && (
        <Modal
          title={modalContent.title}
          buttonText={modalContent.button}
          onClose={modalContent.onClose || (() => setIsModalOpen(false))}
        >
          <p>{modalContent.text}</p>
        </Modal>
      )}

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md p-6 text-center">
        {/* --- SCREEN 1: GREETING --- */}
        {step === "greeting" && (
          <div className="flex flex-col items-center justify-center space-y-8 min-h-[400px]">
            <h1
              className={`text-4xl md:text-5xl font-serif text-yellow-300 transition-opacity duration-1000 ${
                titleVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="relative inline-block">
                Greetings, Alina!
                {/* Pulsating gold outline */}
                <span className="absolute -inset-1 border-2 border-yellow-500/50 rounded-lg animate-pulse"></span>
              </span>
            </h1>
            <p
              className={`text-lg text-yellow-100 transition-opacity duration-1000 delay-500 ${
                textVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              A very happy birthday to you. To begin the celebration, you must
              first acquire the necessary materials.
            </p>
            <button
              onClick={handleDownloadClick}
              className={`px-8 py-3 font-bold text-gray-900 uppercase transition-all duration-700 transform rounded-lg shadow-lg bg-yellow-600 hover:bg-yellow-500 hover:scale-105 ${
                buttonVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
            >
              Download Materials
            </button>
          </div>
        )}

        {/* --- SCREEN 2: DOWNLOADING / ERROR --- */}
        {/* This screen is only shown *before* the modal appears */}
        {(step === "downloading" || step === "error") && !isModalOpen && (
          <div className="flex flex-col items-center justify-center space-y-8 min-h-[400px]">
            <h2 className="text-2xl font-serif text-yellow-300">
              {step === "downloading" ? "Downloading..." : "Download Failed"}
            </h2>

            {/* Progress Bar */}
            <div className="w-full h-6 rounded-full bg-gray-700 ring-2 ring-yellow-700/50 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-yellow-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-lg text-yellow-100">{progress}% Complete</p>

            {/* This space is intentionally blank, as the modal flow is now automatic */}
          </div>
        )}

        {/* --- SCREEN 3 & 4: SCANNING / FOUND --- */}
        {/* 'found' step is kept for future, but currently unreachable */}
        {(step === "scanning" || step === "found") && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-serif text-yellow-300">
              {step === "found" ? "Upgrade Complete!" : "Magical Upgrade"}
            </h2>

            {/* Camera Viewport */}
            <div className="relative w-full overflow-hidden rounded-lg shadow-2xl aspect-square bg-gray-950 ring-4 ring-yellow-700/50">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  step === "found" ? "opacity-30" : "opacity-100"
                }`}
              ></video>

              {/* HUD / Crosshair */}
              {step === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1/3 h-1/3 border-2 border-yellow-400/50 rounded-lg"></div>
                  <div className="absolute w-1 h-8 -translate-y-1/2 bg-yellow-400/50 top-1/2 left-1/2"></div>
                  <div className="absolute w-8 h-1 -translate-x-1/2 bg-yellow-400/50 top-1/2 left-1/2"></div>
                </div>
              )}

              {/* "Found" Bounding Box Overlay (kept for future) */}
              {step === "found" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2/3 h-2/3 border-8 border-red-500 rounded-lg shadow-inner animate-pulse"></div>
                  <div className="absolute p-4 text-center">
                    <h3 className="text-2xl font-bold text-white">
                      Magical Object Found!
                    </h3>
                    <p className="mt-2 text-lg text-white">
                      This is the source of enchanting power required for the
                      upgrade.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Message Placeholder */}
            <p className="h-6 text-lg text-yellow-100"></p>

            {/* Scan/Restart Button */}
            {step === "scanning" && (
              <button
                // onClick logic removed as requested
                className="w-full px-8 py-3 font-bold text-gray-900 uppercase transition-all transform rounded-lg shadow-lg bg-yellow-600 hover:bg-yellow-500 hover:scale-105"
              >
                SCAN
              </button>
            )}

            {/* This button is not reachable in the current flow */}
            {step === "found" && (
              <button
                onClick={handleRestart}
                className="w-full px-8 py-3 font-bold text-gray-900 uppercase transition-all transform rounded-lg shadow-lg bg-green-500 hover:bg-green-400 hover:scale-105"
              >
                Quest Complete (Restart)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
