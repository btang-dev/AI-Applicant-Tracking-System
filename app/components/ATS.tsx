type Suggestion = {
    type: "good" | "improve";
    tip: string;
};

type ATSProps = {
    score: number;
    suggestions: Suggestion[];
};

const ATS = ({ score, suggestions }: ATSProps) => {
    const gradientColor = score > 69
        ? "from-green-100"
        : score > 49
            ? "from-yellow-100"
            : "from-red-100";

    const scoreIcon = score > 69
        ? "/icons/ats-good.svg"
        : score > 49
            ? "/icons/ats-warning.svg"
            : "/icons/ats-bad.svg";

    return (
        <article className={`w-full rounded-2xl bg-gradient-to-b ${gradientColor} to-white shadow-md`}>
            <div className="flex flex-row items-center gap-4 p-6">
                <img src={scoreIcon} alt="" className="size-12" />
                <h2 className="text-2xl font-bold text-black">
                    ATS score - {score}/100
                </h2>
            </div>

            <div className="px-6 pb-6">
                <h3 className="text-xl font-semibold text-black">
                    How well does your resume pass through Applicant Tracking Systems?
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    Your resume was scanned like an employer would. Here&apos;s how it performed:
                </p>

                <ul className="mt-4 flex flex-col gap-3">
                    {suggestions.map(({ type, tip }, index) => (
                        <li key={`${type}-${tip}-${index}`} className="flex items-start gap-3">
                            <img
                                src={type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                                alt=""
                                className="mt-0.5 size-5 shrink-0"
                            />
                            <span className="text-sm text-gray-700">{tip}</span>
                        </li>
                    ))}
                </ul>

                <p className="mt-5 text-sm font-medium text-gray-700">
                    Keep improving your resume to increase your chances of getting noticed.
                </p>
            </div>
        </article>
    );
};

export default ATS;
