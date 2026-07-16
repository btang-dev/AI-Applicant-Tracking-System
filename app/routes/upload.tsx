import {type FormEvent, useState } from 'react';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar';
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID, getErrorMessage} from '~/lib/utils';
import {normalizeFeedback, parseFeedbackText} from '~/lib/feedback';
import { AIResponseFormat, prepareInstructions } from "../../constants";

const extractTextContent = (content: unknown): string | null => {
    if (typeof content === 'string') {
        return content.trim() ? content : null;
    }

    if (Array.isArray(content)) {
        for (const block of content) {
            const text = extractTextContent(block);
            if (text) return text;
        }
        return null;
    }

    if (content && typeof content === 'object') {
        const block = content as Record<string, unknown>;

        for (const key of ['text', 'output_text', 'content']) {
            const text = extractTextContent(block[key]);
            if (text) return text;
        }
    }

    return null;
};

const extractAIResponseText = (response: unknown): string | null => {
    if (!response || typeof response !== 'object') {
        return extractTextContent(response);
    }

    const result = response as Record<string, any>;
    const candidates = [
        result.message?.content,
        result.choices?.[0]?.message?.content,
        result.result?.message?.content,
        result.result?.content,
        result.output_text,
        result.text,
        result.content,
    ];

    for (const candidate of candidates) {
        const text = extractTextContent(candidate);
        if (text) return text;
    }

    return null;
};

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
        if (file) {
            console.info('[Upload] File selected', {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: new Date(file.lastModified).toISOString(),
            });
        }
    }

    const handleAnalyze = async ( {companyName, jobTitle, jobDescription, file}: { companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        setIsProcessing(true);
        setStatusText('Uploading your resume...');
        let stage = 'validating the selected file';

        try {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                throw new Error('Only PDF resumes can be converted to an image.');
            }

            stage = 'uploading the resume';
            const uploadedFile = await fs.upload([file]);
            if(!uploadedFile) throw new Error('Failed to upload the resume.');
            console.info('[Upload] Resume uploaded', uploadedFile);

            setStatusText('Converting to image...');
            stage = 'converting the PDF to an image';
            const imageFile = await convertPdfToImage(file);
            if(!imageFile.file) {
                throw new Error(imageFile.error ?? 'Failed to convert the PDF to an image.');
            }
            console.info('[Upload] PDF converted', {
                imageUrl: imageFile.imageUrl,
                name: imageFile.file.name,
                type: imageFile.file.type,
                size: imageFile.file.size,
            });

            setStatusText('Uploading the image...');
            stage = 'uploading the preview image';
            const uploadedImage = await fs.upload([imageFile.file]);
            if(!uploadedImage) throw new Error('Failed to upload the converted image.');
            console.info('[Upload] Preview image uploaded', uploadedImage);

            setStatusText('Preparing data...');
            stage = 'saving the initial resume data';
            const uuid = generateUUID();
            const resumeKey = `resume:${uuid}`;
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: normalizeFeedback(null),
            }
            const initialSaveSucceeded = await kv.set(resumeKey, JSON.stringify(data));
            if (!initialSaveSucceeded) throw new Error('Failed to save the resume data.');
            console.info('[Upload] Resume data saved', {key: resumeKey, data});

            setStatusText('Analyzing...');
            stage = 'requesting AI feedback';

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription, AIResponseFormat })
            );
            if(!feedback) throw new Error('Failed to analyze the resume.');
            console.info('[Upload] Raw AI response', feedback);

            const feedbackText = extractAIResponseText(feedback);
            if (!feedbackText) throw new Error('The AI response did not contain feedback text.');

            stage = 'parsing the AI feedback';
            data.feedback = parseFeedbackText(feedbackText);
            console.info('[Upload] Parsed feedback', data.feedback);

            stage = 'saving the analyzed resume data';
            const finalSaveSucceeded = await kv.set(resumeKey, JSON.stringify(data));
            if (!finalSaveSucceeded) throw new Error('Failed to save the analyzed resume data.');

            setStatusText('Analysis complete.');
            console.info('[Upload] Complete resume record', {key: resumeKey, data});
            navigate(`/resume/${uuid}`);
        } catch (error) {
            const message = getErrorMessage(error);
            console.error(`[Upload] Failed during ${stage}`, error);
            setStatusText(`Error during ${stage}: ${message}`);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent the default form submission behavior

        const formData = new FormData(e.currentTarget); // Create a FormData object from the submitted form

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        console.log('Resume analysis form data:', {
            companyName, jobTitle, jobDescription, file
        }); // Log the form data and the selected file to the console
        if(!file) return; // If no file is selected, exit the function

        void handleAnalyze({ companyName, jobTitle, jobDescription, file});

    }
    
    return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
            <h1>Smart Feedback for your dream job</h1>
            {isProcessing ? (
                <>
                <h2>{statusText}</h2>
                <img src="/images/resume-scan.gif" className="w-full" />
                </>
            ) : (
                <h2>Drop your resume for an ATS score</h2>
            )}
            {!isProcessing && (
                <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="form-div">
                        <label htmlFor="company-name">Company Name</label>
                        <input type="text" name="company-name" placeholder="company-name" id="company-name"/>
                    </div>

                    <div className="form-div">
                        <label htmlFor="job-title">Job Title</label>
                        <input type="text" name="job-title" placeholder="job-title" id="job-title"/>
                    </div>

                    <div className="form-div">
                        <label htmlFor="job-description">Job Description</label>
                        <textarea rows={5} name="job-description" placeholder="job-description" id="job-description"/>
                    </div>

                    <div className="form-div">
                        <label htmlFor="uploader">Upload Resume</label>
                        <FileUploader onFileSelect={handleFileSelect} />
                    </div>

                    <button className="primary-button" type="submit">
                        Analyze Resume
                    </button>
                    
                </form>
                )}
        </div>
      </section>
    </main>
    )
}
export default Upload
