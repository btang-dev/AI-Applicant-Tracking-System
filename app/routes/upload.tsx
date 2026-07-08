import {type FormEvent, useState } from 'react';
import Navbar from '~/components/Navbar';


const Upload = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {}
    
    return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
            <h1>Smart Feedback for your dream job</h1>
            {isProcessing ? (
                <>
                <h2>status text</h2>
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
                    
                </form>
                )}
        </div>
      </section>
    </main>
    )
}
export default Upload