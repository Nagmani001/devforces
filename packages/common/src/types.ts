export interface PAYLOAD_TO_PUSH {
  id: string,
  challengeId: string,
  url: string
}


export interface PAYLOAD_TO_RECEIVE {
  passed: number,
  total: number,
  failed: number
}
