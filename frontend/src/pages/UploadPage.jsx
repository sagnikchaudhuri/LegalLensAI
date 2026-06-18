import { Camera, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import JourneyFrame from "../components/JourneyFrame";
import { uploadDocument } from "../services/api";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["pdf", "docx", "txt", "png", "jpg", "jpeg"]);
const DOCUMENT_ACCEPT = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  ".pdf",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
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

  const handleFile = async (file) => {
    if (!file || uploading) return;
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

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
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
            <button className="capture-action primary" onClick={() => fileRef.current?.click()} disabled={uploading} aria-describedby="upload-help">
              <span><Upload size={20} strokeWidth={1.5} /></span>Upload File
            </button>
            <button className="capture-action" onClick={() => cameraRef.current?.click()} disabled={uploading} aria-describedby="upload-help">
              <span><Camera size={20} strokeWidth={1.5} /></span>Take Photo
            </button>
          </div>
          <input ref={fileRef} hidden type="file" accept={DOCUMENT_ACCEPT} onChange={handleInputChange} aria-label="Choose legal document file" />
          <input ref={cameraRef} hidden type="file" accept="image/png,image/jpeg" capture="environment" onChange={handleInputChange} aria-label="Capture contract photo" />
          <span id="upload-help" className="sr-only">Supported files are PDF, DOCX, TXT, PNG, JPG, and JPEG up to 15MB.</span>
        </div>
        {error && <p className="capture-error" role="alert">{error}</p>}
      </div>
    </JourneyFrame>
  );
}
