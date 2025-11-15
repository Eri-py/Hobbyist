import { useWindowDimensions } from "react-native";

export function useDeviceType() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isPhone = width < 768;

  return {
    isTablet,
    isPhone,
    width,
    height: useWindowDimensions().height,
  };
}
