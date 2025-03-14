import { auth } from "@/auth";
import SearchBox from "@/components/SearchBox";
import SuggestionBox from "@/components/SuggestionBox";
import Layout from "@/components/Layout";
import AuthPrompt from "@/components/AuthPrompt";

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
      <div className="py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">
            Search Your LinkedIn Network
          </h1>
          <div className="mb-8">
            <SearchBox />
          </div>

          {isAuthenticated ? (
            <div className="space-y-8 mt-8">
              {suggestions.map((group, index) => (
                <SuggestionBox
                  key={index}
                  title={group.title}
                  items={group.items}
                />
              ))}
            </div>
          ) : (
            <AuthPrompt />
          )}
        </div>
      </div>
    </Layout>
  );
}
