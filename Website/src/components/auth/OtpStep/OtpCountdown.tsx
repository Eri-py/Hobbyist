import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

type OtpCountdownProps = {
  expiresAt: Date;
};

export function OtpCountdown({ expiresAt }: OtpCountdownProps) {
  const theme = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const isExpired = timeRemaining === 0;

  const zeroPad = (num: number) => String(num).padStart(2, "0");

  if (isExpired) {
    return (
      <Typography
        color={theme.palette.error.main}
        sx={{
          fontSize: 15,
          textAlign: "center"
        }}>Code expired
              </Typography>
    );
  }

  return (
    <Typography
      color={theme.palette.text.secondary}
      sx={{
        fontSize: 15,
        textAlign: "center"
      }}>Code expires in{" "}
      <b>
        {zeroPad(minutes)}:{zeroPad(seconds)}
      </b>
    </Typography>
  );
}
