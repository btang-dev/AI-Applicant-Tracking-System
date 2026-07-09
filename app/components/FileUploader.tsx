import {useCallback} from "react";
import {useDropzone} from "react-dropzone";

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void; // Optional callback function to handle file selection
}

export const formatSize = (bytes: number) => {
    const sizeInKB = bytes / 1024;
    const sizeInMB = sizeInKB / 1024;
    const sizeInGB = sizeInMB / 1024;

    if (sizeInGB >= 1) return `${sizeInGB.toFixed(2)} GB`;
    if (sizeInMB >= 1) return `${sizeInMB.toFixed(2)} MB`;

    return `${sizeInKB.toFixed(2)} KB`;
}

const FileUploader = ( {onFileSelect}: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Do something with the files
        const file = acceptedFiles[0] || null;

        onFileSelect?.(file); // Call the callback function if provided
    }, [onFileSelect]);
    const {getRootProps, getInputProps, isDragActive, acceptedFiles} = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/pdf': ['.pdf'], // Accept PDF files
            'application/msword': ['.doc'], // Accept DOC files
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], // Accept DOCX files
        },
        maxSize: 20 * 1024 * 1024, // 20 MB
    });

    const file = acceptedFiles[0] || null; // Get the first accepted file or null if none

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="space-y-4 cursor-pointer">
                    {file ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center space-x-3">
                                <img src="/images/pdf.png" alt="pdf" className="size-10" />
                                <div className="flex min-w-0 flex-col text-left">
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                                <img src="/icons/check.svg" alt="selected" className="size-6" />
                            </div>
                            <button type="button" className="p-2 cursor-pointer" onClick={(e) => {
                                 onFileSelect?.(null); // Clear the selected file
                                 e.stopPropagation(); // Prevent the click from triggering the dropzone click
                             }}>
                                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="upload" className="size-20" />
                            </div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">
                                    Click to Upload
                                </span> or drag and drop
                            </p>
                            <p className="text-lg text-gray-500">
                                Supported file types: .pdf, .doc, .docx (max 20 MB)
                            </p>
                        </div> 
                    )}

                </div>
            </div>
        </div>
    )
}
export default FileUploader
