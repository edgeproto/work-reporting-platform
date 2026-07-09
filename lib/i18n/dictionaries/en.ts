export type Dictionary = {
  app: {
    title: string;
  };
  header: {
    language: string;
    signOut: string;
  };
  nav: {
    home: string;
    myFeed: string;
    teamFeed: string;
    users: string;
    settings: string;
  };
  roles: {
    ADMIN: string;
    MANAGER: string;
    MEMBER: string;
  };
  auth: {
    signIn: string;
    signInDescription: string;
    email: string;
    password: string;
    signingIn: string;
    loading: string;
    passwordSetSuccess: string;
  };
};

export const en: Dictionary = {
  app: {
    title: "Status Reports",
  },
  header: {
    language: "Language",
    signOut: "Sign out",
  },
  nav: {
    home: "Home",
    myFeed: "My Feed",
    teamFeed: "Team Feed",
    users: "Users",
    settings: "Settings",
  },
  roles: {
    ADMIN: "Admin",
    MANAGER: "Manager",
    MEMBER: "Member",
  },
  auth: {
    signIn: "Sign in",
    signInDescription: "Enter your credentials to access the reporting platform.",
    email: "Email",
    password: "Password",
    signingIn: "Signing in…",
    loading: "Loading…",
    passwordSetSuccess: "Password set successfully. You can sign in now.",
  },
};
