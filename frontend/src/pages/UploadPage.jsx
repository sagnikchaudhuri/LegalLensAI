import { Camera, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import JourneyFrame from "../components/JourneyFrame";
import { uploadDocument } from "../services/api";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["pdf", "docx", "txt", "png", "jpg", "jpeg"]);
const CAMERA_ACCEPT = "image/*";
const DOCUMENT_ACCEPT = [
  ".pdf",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
].join(",");

function validateFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ACCEPTED_EXTENSIONS.has(extension)) {
    return "Please choose a PDF, DOCX, TXT, PNG, JPG, or JPEG file.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "This file is larger than 15MB. Please choose a smaller document.";
  }
  return "";
}

function readableSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFile = async (file, source = "file") => {
    if (uploading) return;
    if (!file) {
      setError(source === "camera" ? "No photo was selected. Please try Take Photo again." : "No file was selected. Please choose a document.");
      return;
    }
    setError("");
    setFileName(file.name);
    setFileSize(readableSize(file.size));
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadDocument(file);
      navigate(`/analyze/${uploaded.document_id}`, { state: { fileName: uploaded.file_name } });
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    if (uploading) return;
    if (!fileRef.current) {
      setError("File picker is not available in this browser session. Please refresh and try again.");
      return;
    }
    setError("");
    fileRef.current.value = "";
    fileRef.current.click();
  };

  const openCameraPicker = () => {
    if (uploading) return;
    if (!cameraRef.current) {
      setError("Camera capture is not available in this browser session. Please refresh and try again.");
      return;
    }
    setError("");
    cameraRef.current.value = "";
    cameraRef.current.click();
  };

  const handleDocumentInputChange = (event) => {
    handleFile(event.currentTarget.files?.[0], "file");
    event.currentTarget.value = "";
  };

  const handleCameraInputChange = (event) => {
    handleFile(event.currentTarget.files?.[0], "camera");
    event.currentTarget.value = "";
  };

  return (
    <JourneyFrame backTo="/" menu={false} className="capture-frame">
      <div className="capture-stage">
        <div className={`upload-orbit ${uploading ? "is-uploading" : ""}`}>
          <span className="upload-arc" />
          <div className="upload-symbol"><FileUp size={58} strokeWidth={0.85} /></div>
          <h1>{uploading ? "Securing your contract" : "Upload a contract"}</h1>
          <p>{uploading ? "Uploading securely..." : "Choose a file or capture a document"}</p>
          {fileName && (
            <div className="selected-file" aria-live="polite">
              <strong>{fileName}</strong>
              <span>{fileSize}</span>
            </div>
          )}
          <small>PDF, DOCX, TXT, PNG, JPG, JPEG up to 15MB</small>
          <p className="privacy-note">
            Your document is processed securely for analysis and can be deleted anytime. AI-generated legal review is informational and not legal advice.
          </p>
          <div className="capture-actions">
            <button
              className="capture-action primary"
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              aria-describedby="upload-help"
              aria-label="Upload contract file"
            >
              <span><Upload size={20} strokeWidth={1.5} /></span>Upload File
            </button>
            <button
              className="capture-action"
              type="button"
              onClick={openCameraPicker}
              disabled={uploading}
              aria-describedby="camera-help"
              aria-label="Take a photo of a contract"
            >
              <span><Camera size={20} strokeWidth={1.5} /></span>Take Photo
            </button>
          </div>
          <input
            ref={fileRef}
            className="file-input-hidden"
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={handleDocumentInputChange}
            aria-label="Choose legal document file"
            tabIndex={-1}
          />
          <input
            ref={cameraRef}
            className="file-input-hidden"
            type="file"
            accept={CAMERA_ACCEPT}
            capture="environment"
            onChange={handleCameraInputChange}
            aria-label="Capture contract photo"
            tabIndex={-1}
          />
          <span id="upload-help" className="sr-only">Supported files are PDF, DOCX, TXT, PNG, JPG, and JPEG up to 15MB.</span>
          <span id="camera-help" className="sr-only">Use your device camera to capture a PNG, JPG, or JPEG image of a document.</span>
        </div>
        {error && <p className="capture-error" role="alert">{error}</p>}
      </div>
    </JourneyFrame>
  );
}
