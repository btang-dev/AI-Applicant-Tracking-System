import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { SITE_DESCRIPTION, SITE_NAME } from "~/lib/brand";

export function meta({}: Route.MetaArgs) {
  return [
    { title: SITE_NAME },
    { name: "description", content: SITE_DESCRIPTION },
  ];
}

export default function Home() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);

    useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated]);

    useEffect(() => {
      const loadResumes = async () => {
        setLoadingResumes(true);

        const storedResumes = (await kv.list('resume:*', true)) as KVItem[] | undefined;

        const parsedResumes = (storedResumes ?? []).map((resume) => (
          JSON.parse(resume.value) as Resume
        ));

        console.log("parsedResumes", parsedResumes);
        setResumes(parsedResumes);
        setLoadingResumes(false);
      };

      void loadResumes();
    }, []);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <section className="main-section">
      <Navbar />

      <div className="page-heading py-16">
        <h1> Track Your Applications & Resume Ratings</h1>
        {!loadingResumes && resumes?.length === 0 ? (
          <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ): (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>
      {loadingResumes && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-[200px]" />
        </div>
      )}

    {!loadingResumes && resumes.length > 0 && (
    <div className="resumes-section">
      {resumes.map((resume) => (
        <ResumeCard key={resume.id} resume={resume} />
      ))}
    </div>
    )}

    {!loadingResumes && resumes?.length === 0 && (
      <div className="flex flex-col items-center justify-center mt-10 gap-4">
        <Link to="/upload" className="primary-button w-fit text-xl font-semibold"> 
          Upload Resume
        </Link>
      </div>
    )}
  </section>
  </main>
}
