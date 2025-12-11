function getOtp() {
  let otp = "0";
  for (let i = 0; i < 6; i++) {
    otp = Math.floor(Math.random() * 9) * 10 + otp;
  }
  return otp;
}
