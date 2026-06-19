import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { type Href, useRouter } from "expo-router";
import { Button, Form, Host, SecureField, Section, Text, TextField, VStack } from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  buttonStyle,
  controlSize,
  disabled,
  font,
  foregroundStyle,
  keyboardType,
  onSubmit,
  submitLabel,
  textContentType,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";

type Props = {
  handleNext: () => void;
  isPending: boolean;
  serverError?: string | null;
};

// SwiftUI port of UsernamePasswordStep — Expo UI pilot. Original kept alongside for comparison.
export function UsernamePasswordStepNative({ handleNext, isPending, serverError }: Props) {
  const router = useRouter();
  const { control } = useFormContext();
  const identifier = useController({ control, name: "identifier" });
  const password = useController({ control, name: "password" });
  const [showPassword, setShowPassword] = useState(false);

  const idError = identifier.fieldState.error?.message;
  const pwError = password.fieldState.error?.message;
  const errorText = [font({ textStyle: "footnote" }), foregroundStyle("red")];

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <Form>
        <Section>
          <VStack alignment="leading" spacing={4}>
            <Text modifiers={[font({ textStyle: "largeTitle", weight: "bold" })]}>Welcome back</Text>
            <Text
              modifiers={[
                font({ textStyle: "subheadline" }),
                foregroundStyle({ type: "hierarchical", style: "secondary" }),
              ]}
            >
              Log in to your Hobbyist account
            </Text>
          </VStack>
        </Section>

        <Section>
          <TextField
            placeholder="Username or email"
            autoFocus
            onTextChange={identifier.field.onChange}
            modifiers={[
              textContentType("username"),
              keyboardType("email-address"),
              textInputAutocapitalization("never"),
              autocorrectionDisabled(),
              submitLabel("next"),
            ]}
          />
          {idError ? <Text modifiers={errorText}>{idError}</Text> : null}

          {showPassword ? (
            <TextField
              placeholder="Password"
              onTextChange={password.field.onChange}
              modifiers={[
                textContentType("password"),
                textInputAutocapitalization("never"),
                autocorrectionDisabled(),
                submitLabel("go"),
                onSubmit(handleNext),
              ]}
            />
          ) : (
            <SecureField
              placeholder="Password"
              onTextChange={password.field.onChange}
              modifiers={[textContentType("password"), submitLabel("go"), onSubmit(handleNext)]}
            />
          )}
          {pwError ? <Text modifiers={errorText}>{pwError}</Text> : null}

          {/* SecureField has no built-in reveal toggle, so swap to a plain field on demand. */}
          <Button
            label={showPassword ? "Hide password" : "Show password"}
            onPress={() => setShowPassword((v) => !v)}
            modifiers={[buttonStyle("borderless"), controlSize("small")]}
          />
        </Section>

        {serverError ? (
          <Section>
            <Text modifiers={errorText}>{serverError}</Text>
          </Section>
        ) : null}

        <Section>
          <Button
            label={isPending ? "Signing in…" : "Continue"}
            onPress={handleNext}
            modifiers={[buttonStyle("borderedProminent"), controlSize("large"), disabled(isPending)]}
          />
          <Button
            label="New to Hobbyist? Create an account"
            onPress={() => router.push("/sign-up" as Href)}
            modifiers={[buttonStyle("borderless")]}
          />
        </Section>
      </Form>
    </Host>
  );
}
