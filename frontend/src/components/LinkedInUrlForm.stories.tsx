// frontend/src/components/LinkedInUrlForm.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { LinkedInUrlForm, WaitlistForm } from "./LinkedInUrlForm";
import { ThemeProvider } from "@/lib/theme-context";

// Mock data
const mockAuthData = {
  email: "test@example.com",
  name: "Test User",
  image: "https://example.com/image.jpg",
};

// Mock submit handlers
const mockSubmitLinkedIn = async (url: string) => {
  return new Promise<void>((resolve) => {
    console.log("LinkedIn URL submitted:", url);
    setTimeout(resolve, 1000);
  });
};

const mockSubmitWaitlist = async (email: string) => {
  return new Promise<void>((resolve) => {
    console.log("Email submitted to waitlist:", email);
    setTimeout(resolve, 1000);
  });
};

const meta: Meta<typeof LinkedInUrlForm> = {
  title: "Components/LinkedInUrlForm",
  component: LinkedInUrlForm,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    // Add backgrounds for better theme visibility
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a202c' },
      ],
    },
  },
};

export default meta;
type LinkedInUrlFormStory = StoryObj<typeof LinkedInUrlForm>;
type WaitlistFormStory = StoryObj<typeof WaitlistForm>;

// LinkedIn URL Form Stories
export const Default: LinkedInUrlFormStory = {
  args: {
    userId: "user-123",
    linkedInAuthData: mockAuthData,
    onSubmit: mockSubmitLinkedIn,
  },
};

// Show form in dark theme
export const DarkTheme: LinkedInUrlFormStory = {
  args: {
    userId: "user-123",
    linkedInAuthData: mockAuthData,
    onSubmit: mockSubmitLinkedIn,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    themes: {
      themeOverride: 'dark',
    },
  },
};

// Waitlist Form Stories
export const Waitlist: WaitlistFormStory = {
  render: () => (
    <WaitlistForm
      userId="user-123"
      linkedInAuthData={mockAuthData}
      onSubmit={mockSubmitWaitlist}
    />
  ),
};

// Simplified WaitlistSuccess story without auto-submit (which might cause loading issues)
export const WaitlistSuccess: WaitlistFormStory = {
  render: () => (
    <WaitlistForm
      userId="user-123"
      linkedInAuthData={mockAuthData}
      onSubmit={mockSubmitWaitlist}
    />
  ),
};
