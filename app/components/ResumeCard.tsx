import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume}) => {
    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex min-w-0 flex-1 flex-col gap-2 text-left">
                    <h2 className="!text-black font-bold break-words">
                        {companyName}
                    </h2>
                    <h3 className="text-lg break-words text-gray-500">
                        {jobTitle}
                    </h3>
                </div>
                <div className="ml-3 flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>
            <div className="resume-card-image-wrapper gradient-border animate-in fade-in duration-1000">
                <img
                    src={imagePath}
                    alt="resume"
                    className="resume-card-image"
                />
            </div>
        </Link>
    )
}

export default ResumeCard
