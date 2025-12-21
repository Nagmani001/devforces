
export interface signupType {
  username: string,
  password: string,
  email: string
}

export interface signinType {
  email: string,
  password: string
}


export type Challenge = {
  id: string;
  title: string;
  notionLink: string;
  testFile: string;
  totalTestCases: number | "";
  dockerCompose: string;
  startupScript: string;
};

export interface getStatusOfContestReturns {
  status: string,
  startsAtMessage?: string
}

