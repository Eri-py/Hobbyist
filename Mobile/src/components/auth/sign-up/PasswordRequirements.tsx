import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type PasswordRequirementsProps = {
  password: string;
};

const REQUIREMENTS = [
  {
    test: (password: string) => password.length >= 8,
    message: "At least 8 characters long",
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    message: "At least one uppercase letter (A-Z)",
  },
  {
    test: (password: string) => /[a-z]/.test(password),
    message: "At least one lowercase letter (a-z)",
  },
  {
    test: (password: string) => /[0-9]/.test(password),
    message: "At least one number (0-9)",
  },
  {
    test: (password: string) => /[#?!@$%^&\-._]/.test(password),
    message: "At least one special character (#?!@$%^&-._)",
  },
];

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const theme = useTheme();

  const requirementRows = useMemo(
    () =>
      REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password || "");
        const iconColor = met ? "green" : theme.colors.error;

        return (
          <View key={requirement.message} style={styles.row}>
            <MaterialCommunityIcons name={met ? "check" : "close"} size={18} color={iconColor} />
            <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              {requirement.message}
            </Text>
          </View>
        );
      }),
    [password, theme.colors.onSurfaceVariant, theme.colors.error]
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.colors.onSurfaceVariant }]}>
        Passwords must contain:
      </Text>
      {requirementRows}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  heading: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 2,
  },
  message: {
    fontSize: 14,
  },
});
