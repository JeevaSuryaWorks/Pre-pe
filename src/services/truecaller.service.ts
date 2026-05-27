/**
 * Truecaller SDK Integration Service (Simulated Mobile Web Flow)
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the user profile retrieval workflow for mobile websites.
 * Mimics fetching the verified user profile using the Authorization Access Token
 * returned after the user consents to verification via their Truecaller app.
 *
 * @link https://docs.truecaller.com/truecaller-sdk/mobile-websites/integrating-with-your-mobile-website/fetch-user-profile
 */

export interface TruecallerProfile {
  phoneNumbers: string[];
  avatarUrl?: string;
  aboutMe?: string;
  jobTitle?: string;
  companyName?: string;
  isActive: boolean;
  gender: string;
  badges: string[];
  name: {
    first: string;
    last: string;
  };
}

/**
 * Simulates the Truecaller User Profile Fetch (/v1/default endpoint)
 * Returns deterministic profiles based on the phone number digit summary,
 * ensuring high-fidelity, predictable, and reproducible verified results during UAT.
 *
 * @param {string} mobileNumber - 10-digit mobile number to resolve profile for
 * @returns {Promise<TruecallerProfile | null>}
 */
export async function fetchTruecallerProfileSimulated(mobileNumber: string): Promise<TruecallerProfile | null> {
  // Simulate network latency (mimicking standard web fetch)
  await new Promise((resolve) => setTimeout(resolve, 850));

  const cleanNum = mobileNumber.replace(/\D/g, '');
  if (cleanNum.length < 10) return null;

  // A list of realistic developer verified profiles for presentation and demo
  const SAMPLE_PROFILES = [
    {
      first: "Rajat",
      last: "Kapoor",
      jobTitle: "CEO",
      companyName: "ABC",
      gender: "Male",
      badges: ["verified", "premium"],
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
    },
    {
      first: "Jeeva",
      last: "Surya",
      jobTitle: "Chief Architect",
      companyName: "Prepe Tech",
      gender: "Male",
      badges: ["verified"],
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
    },
    {
      first: "Aditya",
      last: "Sharma",
      jobTitle: "Senior Developer",
      companyName: "JS Corp",
      gender: "Male",
      badges: ["verified", "premium"],
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
    },
    {
      first: "Priya",
      last: "Patel",
      jobTitle: "Lead UI Designer",
      companyName: "DesignStudio",
      gender: "Female",
      badges: ["verified"],
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
    },
    {
      first: "Rohan",
      last: "Verma",
      jobTitle: "Product Manager",
      companyName: "Finance Hub",
      gender: "Male",
      badges: ["verified"],
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80"
    }
  ];

  // Map the clean number deterministically to one of the samples
  const digitSum = cleanNum.split('').reduce((sum, char) => sum + parseInt(char || '0', 10), 0);
  const selected = SAMPLE_PROFILES[digitSum % SAMPLE_PROFILES.length];

  return {
    phoneNumbers: [cleanNum],
    isActive: true,
    gender: selected.gender,
    badges: selected.badges,
    jobTitle: selected.jobTitle,
    companyName: selected.companyName,
    avatarUrl: selected.avatarUrl,
    name: {
      first: selected.first,
      last: selected.last
    }
  };
}
