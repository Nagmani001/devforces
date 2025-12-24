//TODO: should be react query mutation 
import axios from "axios";
import { Challenge, getStatusOfContestReturns } from "./types";
import { ENDED, LIVE, MONTH_NAMES, NOT_STARTED } from "@repo/common/consts";

export const BASE_URL = "http://localhost:3001";

export async function getUserInfo(token: string) {
  try {
    const me = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    return {
      success: true,
      data: me.data
    }
  } catch (err) {
    return {
      success: false,
    }
  }
}

export async function getContest(token: string, page: string) {
  try {
    const me = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    let contests;
    let isAdmin;
    if (me.data.isAdmin) {
      isAdmin = true;
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/contest?page=${page}`, {
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
        const response = await axios.get(`${BASE_URL}/api/user/contest?page=${page}`, {
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
  totalTestCases: "",
  dockerCompose:
    `version: "3.8"
services:
  db:
    image: postgres
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"`,
  startupScript: `# Example startup script
# 1. Start services
# 2. Run migrations
# 3. Run tests
`,
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
  const response = await axios.get(`${BASE_URL}/api/user/contest/${contestId}/challenges`, {
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
    await axios.delete(`${BASE_URL}/api/admin/contest/delete/${contestId}`, {
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

    const contests = await axios.get(`${BASE_URL}/api/admin/contest/update/${contestId}`, {
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
