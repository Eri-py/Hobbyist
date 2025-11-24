import { StyleSheet } from "react-native";
import { ButtonProps, Button } from "react-native-paper";

export function ThemedButton({ style, children, ...props }: ButtonProps) {
  return (
    <Button style={[styles.button, style]} {...props}>
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
  },
});
