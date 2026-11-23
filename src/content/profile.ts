/**
 * Identity and contact content. Everything here renders as plain HTML, so it
 * stays readable without WebGL. Items marked TODO need your real details.
 */
export const PROFILE = {
  name: "YUG",
  tagline: "Engineering Beyond Limits.",
  roles: ["Software Engineer", "Systems Enthusiast"],
  intro:
    "I build things from first principles — interpreters, display pipelines, production software — and I like understanding a system all the way down before abstracting it away.",
  philosophy: [
    "Understand the system before you abstract it.",
    "Ship working software, then make it fast and elegant.",
    "Fundamentals compound: compilers, operating systems, graphics, data.",
  ],
  interests: [
    "Compilers & language design",
    "Operating systems",
    "Graphics & simulation",
    "Full-stack product engineering",
    "Machine learning",
  ],
  skills: {
    Languages: ["TypeScript", "JavaScript", "C", "C++", "Swift", "Kotlin", "Python", "SQL"],
    Frontend: ["React", "Next.js", "Tailwind CSS", "Three.js / R3F"],
    Backend: ["Node.js", "Express", "FastAPI", "PostgreSQL", "MongoDB", "Convex"],
    Systems: ["Flex & Bison", "ScreenCaptureKit", "VideoToolbox", "Android MediaCodec"],
  },
  // TODO: replace with your education history.
  education: [] as { institution: string; degree: string; period: string }[],
  contact: {
    email: "ugantarrajmanu@gmail.com",
    github: "https://github.com/ugantarrajmanu",
    linkedin: "", // TODO: add LinkedIn URL
    resume: "", // TODO: add /resume.pdf to public/ and set "/resume.pdf"
  },
};
