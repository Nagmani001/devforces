//TODO: should be react query mutation 
import axios from "axios";

const FormData = require('form-data');
import { Challenge } from "@repo/common/typescript-types";
import { getStatusOfContestReturns, S3PresignedPostFields } from "./types";
import { ENDED, LIVE, MONTH_NAMES, NOT_STARTED } from "@repo/common/consts";
import { Contest } from "@repo/common/typescript-types";

export const BASE_URL_SERVER = process.env.API_URL || "http://localhost:3001";
export const BASE_URL_CLIENT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const BASE_FRONTEND_URL = "http://localhost:3000";

export async function getUserInfo(token: string) {
  try {
    const me = await axios.get(`${BASE_URL_SERVER}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    console.log("didn't reach catch block", me);
    return {
      success: true,
      data: me.data
    }
  } catch (err) {
    console.log("error occured", err);
    return {
      success: false,
    }
  }
}

export async function getContest(token: string, page: string) {
  try {
    const me = await axios.get(`${BASE_URL_SERVER}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    let contests;
    let isAdmin;
    if (me.data.isAdmin) {
      isAdmin = true;
      try {
        const response = await axios.get(`${BASE_URL_SERVER}/api/admin/contest?page=${page}`, {
          headers: {
            Authorization: token
          }
        });
        contests = response.data;
      } catch (err) {
        return {
          success: false,
          message: "invalid or missing token"
        }
      }

    } else {
      isAdmin = false;
      try {
        const response = await axios.get(`${BASE_URL_SERVER}/api/user/contest?page=${page}`, {
          headers: {
            Authorization: token
          }
        });
        contests = response.data;
      } catch (err) {
        return {
          success: false,
          message: "invalid or missing token"
        }
      }
    }

    return {
      success: true,
      contests,
      isAdmin,
    }
  } catch (err) {
    return {
      success: false,
      message: "invalid or missing token"
    }
  }
}


export const emptyChallenge = (): Challenge => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
  title: "",
  notionLink: "",
  testFile: "",
  baseGithubUrl: "",
  totalTestCases: "",
});


//TODO: from here everything should be written well and tested
export function getTimeInNumbers(time: string) {
  const splittedTime = time.split(":");

  if (splittedTime.length == 1 && splittedTime[0].length <= 1) {
    return {
      hour: 0,
      minute: 0,
      second: 0
    }

  } else if (splittedTime.length == 1) {
    return {
      hour: parseInt(splittedTime[0]),
      minute: 0,
      second: 0
    }
  } else if (splittedTime.length == 2) {

    return {
      hour: parseInt(splittedTime[0]),
      minute: parseInt(splittedTime[1]),
      second: 0
    }
  } else if (splittedTime.length == 3) {
    return {
      hour: parseInt(splittedTime[0]),
      minute: parseInt(splittedTime[1]),
      second: parseInt(splittedTime[2])
    }
  }
}

export function getTimeFromSeconds(time: number) {
  const hour = Math.trunc(time / 3600);
  const minute = Math.trunc((time % 3600) / 60);
  if (hour > 0 && minute > 0) {
    return `${hour} Hour ${minute} minutes`;
  } else if (hour > 0 && minute == 0) {
    return `${hour} Hour`;
  }
}

export function buildISTDate(
  year: number,
  monthIndex: number,
  date: number,
  hour: number,
  minute: number,
  second: number
) {
  const IST_OFFSET_MINUTES = 5 * 60 + 30;

  return new Date(
    Date.UTC(
      year,
      monthIndex,
      date,
      hour,
      minute - IST_OFFSET_MINUTES,
      second
    )
  );
}


function getMonthNameFromIndex(monthIndex: number): string | undefined {
  return MONTH_NAMES[monthIndex];
}

//TODO : this does not follow date shifting at 12 am midnight 
function getStartsAtTimePreeified(start: number, current: number, startsAtDate: Date) {
  const diff = start - current;
  if (diff > 48 * 3600 * 1000) {
    return `Starts ${startsAtDate.getDate()} ${getMonthNameFromIndex(startsAtDate.getMonth())} at ${startsAtDate.getHours()}:${startsAtDate.getMinutes().toString().padStart(2, "0")}`;
  } else if (diff < 48 * 3600 * 1000 && diff > 24 * 3600 * 1000) {
    return `Starts tomorrow at ${startsAtDate.getHours()}:${startsAtDate.getMinutes().toString().padStart(2, "0")}`;
  } else if (diff < 24 * 3600 * 1000) {
    //TODO: this should be implemented 
    // starts in < 2 hour , timer should start ,  respond with what timer should it start
    return `starts today at  ${startsAtDate.getHours()}:${startsAtDate.getMinutes().toString().padStart(2, "0")}`;
  }
}

export function getStatusOfContest(startsAt: Date, duration: number): getStatusOfContestReturns {
  const start = new Date(startsAt).getTime();
  const current = new Date().getTime();
  const end = start + (duration * 1000);


  if (current < start) {
    const getMessage = getStartsAtTimePreeified(start, current, new Date(startsAt));
    return {
      status: NOT_STARTED,
      startsAtMessage: getMessage
    }
  } else if (current > start && current < end) {
    return {
      status: LIVE,
    }
  } else {
    return {
      status: ENDED,
    }
  }
}

export async function getChallengesForContest(contestId: string, token: string) {
  const response = await axios.get(`${BASE_URL_SERVER}/api/user/contest/${contestId}/challenges`, {
    headers: {
      Authorization: token
    }
  })
  return {
    challenges: response.data
  }
}

export async function deleteContest(contestId: string, token: string) {
  try {
    await axios.delete(`${BASE_URL_CLIENT}/api/admin/contest/delete/${contestId}`, {
      headers: {
        Authorization: token
      }
    });
    return {
      success: true
    }
  } catch (err) {
    return {
      success: false
    }
  }
}
export async function getContestForUpdate(contestId: string, token: string) {
  try {

    const contests = await axios.get(`${BASE_URL_CLIENT}/api/admin/contest/update/${contestId}`, {
      headers: {
        Authorization: token
      }
    });

    return {
      success: true,
      contests
    }
  } catch (err) {
    return {
      success: false,
    }
  }

}

export async function getChallengeDetails(challengeId: string, token: string) {
  try {
    const challenge = await axios.get(`${BASE_URL_SERVER}/api/user/contest/challenge/${challengeId}`, {
      headers: {
        Authorization: token
      }
    });
    return {
      success: true,
      data: challenge
    }
  } catch (err) {
    return {
      success: false,
    }
  }
}

export async function sendZippedFile(url: string, conf: S3PresignedPostFields, file: Blob) {
  let data = new FormData();
  data.append('Policy', conf.Policy);
  data.append('X-Amz-Signature', conf["X-Amz-Signature"]);
  data.append('bucket', conf.bucket);
  data.append('X-Amz-Algorithm', conf["X-Amz-Algorithm"]);
  data.append('X-Amz-Credential', conf["X-Amz-Credential"]);
  data.append('key', conf.key);
  data.append('X-Amz-Date', conf["X-Amz-Date"]);
  data.append('file', file);

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: url,
    data: data
  };

  const response = await axios.request(config);
  console.log("uploaded to s3 successfully", response);
}

export async function confirmFileSent(challengeId: string, contestId: string, submissionToken: string) {
  const sendConfirmation = await axios.post(`${BASE_URL_CLIENT}/api/submissions/submit/confirm/${contestId}/${challengeId}`, {
    submissionToken
  }, {
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });
  return sendConfirmation.data;
}
export const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) { start = 2; end = 4; }
    if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};


export const dummyLogs = [
  "Starting Docker services...",
  "Creating network 'devforces_network'...",
  "Starting container 'postgres-db'...",
  "Starting container 'redis-cache'...",
  "Services started successfully.",
  "Building user application image...",
  "Step 1/5 : FROM node:18-alpine",
  "Step 2/5 : WORKDIR /app",
  "Step 3/5 : COPY package*.json ./",
  "Installing dependencies...",
  "Step 4/5 : COPY . .",
  "Step 5/5 : EXPOSE 3000",
  "Successfully built image 'user-backend:latest'",
  "Starting backend service...",
  "Backend service listening on port 3000",
  "Waiting for health check...",
  "Health check passed.",
  "Running test suite...",
  "Executing tests..."
];

export function getHourAndMinutesFromduration(duration: number) {
  const totalMinutes = duration / 60;
  const hour = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hour,
    minutes
  }
}

export function calculateDiffOfContest(initialContestData: Contest, finalData: Contest) {

}
