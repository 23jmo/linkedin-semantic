import { auth } from "@/auth";
import Layout from "@/components/Layout";
import HomeContent from "@/components/HomeContent";

export default async function Home() {
  const session = await auth();
  const isAuthenticated = !!session;

  // Sample suggestions for demonstration
  const suggestions = [
    {
      title: "By Role",
      items: [
        "Software Engineers with experience in AI",
        "Product Managers in fintech",
        "UX Designers who worked at Google",
        "Data Scientists with Python experience",
        "Marketing professionals in healthcare",
      ],
    },
    {
      title: "By Skill",
      items: [
        "People with React.js experience",
        "Machine Learning experts",
        "Project Management professionals",
        "Public Speaking skills",
        "Leadership experience in startups",
      ],
    },
    {
      title: "By Company",
      items: [
        "Former Google employees",
        "People who worked at Microsoft",
        "Amazon alumni in product roles",
        "Facebook engineers",
        "Apple designers",
      ],
    },
  ];

  return (
    <Layout>
      <HomeContent
        isAuthenticated={isAuthenticated}
        suggestions={suggestions}
      />
    </Layout>
  );
}
