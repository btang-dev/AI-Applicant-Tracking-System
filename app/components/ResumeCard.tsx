import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume}) => {
    const {fs} = usePuterStore();
    const [resumeUrl , setResumeUrl ] = useState('');

    useEffect(() => {
      const loadResume = async () => {
        const blob = await fs.read(imagePath);
        if(!blob) return;
        let url = URL.createObjectURL(blob);
        setResumeUrl(url);
      }

      loadResume();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex min-w-0 flex-1 flex-col gap-2 text-left">
                    {companyName && <h2 className="!text-black font-bold break-words">
                        {companyName}
                    </h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">
                        {jobTitle}
                    </h3>}

                    {!companyName && !jobTitle && <h2 className="text-black font-bold">Resume</h2>}
                </div>
                <div className="ml-3 flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>
            {resumeUrl && (<div className="resume-card-image-wrapper gradient-border animate-in fade-in duration-1000">
                <img
                    src={resumeUrl}
                    alt="resume"
                    className="resume-card-image"
                />
            </div>
            )}
        </Link>
    )
}

export default ResumeCard
