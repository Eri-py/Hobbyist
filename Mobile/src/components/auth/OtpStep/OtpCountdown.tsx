import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

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
      <Text style={[styles.text, { color: theme.colors.error }]}>
        Code expired
      </Text>
    );
  }

  return (
    <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
      Code expires in <Text style={styles.bold}>{zeroPad(minutes)}:{zeroPad(seconds)}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    textAlign: "center",
  },
  bold: {
    fontWeight: "700",
  },
});
